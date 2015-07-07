/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 *
 * with parts by Kris Kowal
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 */
/**
 * A testing framework for LaxarJS widgets.
 *
 * @module laxar-testing
 */
define( [
   'require',
   'laxar',
   './lib/helpers',
   './lib/widget_spec_initializer',
   './lib/jasmine_boot',
   'promise-polyfill'
], function( require, ax, helpers, widgetSpecInitializer, jasmineBoot ) {
   'use strict';

   if( Promise._setImmediateFn ) {
      // If this is truthy, the Promise polyfill was loaded instead of a native implementation.
      configurePromisePolyfill();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * The API to instrument and inspect the widget under test. In addition to the listed methods it has all
    * injections for the specific widget technology set as properties. E.g. for every widget technology there
    * will be `axEventBus` and `axContext` properties, but for AngularJS widgets there will be an additional
    * `$scope` property. Note that these are only available after `load()` has been called and the widget
    * controller is loaded.
    *
    * The methods of the event bus instance available as `axEventBus` are already provided with
    * [Jasmine spies](http://jasmine.github.io/2.3/introduction.html#section-Spies).
    *
    * @name Widget
    */
   var widget = {

      /**
       * Configures the widget features before loading with the given configuration object or key/value
       * entries. In fact this is what you'd normally configure under the `features` key in a page descriptor.
       *
       * Shorthands may be used:
       *
       * This
       * ```js
       * beforeEach( function() {
       *    testing.widget.configure( {
       *       search: {
       *          resource: 'search'
       *       }
       *    } );
       * } );
       * ```
       * is equivalent to the following shorter version
       * ```js
       * beforeEach( function() {
       *    testing.widget.configure( 'search.resource', 'search' );
       * } );
       * ```
       *
       * @param {String|Object} keyOrConfiguration
       *    either an object for the full features configuration or the path to the property to configure
       * @param {*} [optionalValue]
       *    if `keyOrConfiguration` is a string, this is the value to set the feature configuration to
       *
       * @memberOf Widget
       */
      configure: function( keyOrConfiguration, optionalValue ) {
         if( !widgetPrivateApi.configure ) {
            throw new Error( 'testing.createSetupForWidget needs to be called prior to configure.' );
         }

         widgetPrivateApi.configure.apply( widgetPrivateApi, arguments );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Loads the given widget and instantiates its controller. As this function is asynchronous, it receives
       * a Jasmine `done` callback, that is called when the widget is ready.
       *
       * The simplest way to call this function is by passing it to its own `beforeEach` call:
       * ```js
       * beforeEach( testing.widget.load );
       * ```
       *
       * @param {Function} done
       *    callback to notify Jasmine, that the asynchronous widget loading has finished
       *
       * @memberOf Widget
       */
      load: function( done ) {
         if( !widgetPrivateApi.load ) {
            throw new Error( 'testing.createSetupForWidget needs to be called prior to load.' );
         }

         if( typeof done !== 'function' ) {
            throw new Error( 'testing.widget.load needs to be called with a Jasmine done-callback function.' );
         }

         widgetPrivateApi.load()
            .catch( handleErrorForJasmine )
            .then( done );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Renders the widget's template by calling the appropriate widget adapter and appends it within a
       * container div to the test's DOM. The widget DOM fragement will be returned in order to simulate
       * user interaction on it. Calling `testing.tearDown()` will remove it again.
       *
       * Note that calling this method for an activity has no effect and hence is unnessecary.
       *
       * @return {Node}
       *    the widget DOM fragment
       *
       * @memberOf Widget
       */
      render: function() {
         if( widgetDomContainer && widgetDomContainer.parentElement ) {
            widgetDomContainer.parentElement.removeChild( widgetDomContainer );
         }

         widgetDomContainer = document.createElement( 'div' );
         widgetDomContainer.id = 'widgetContainer';
         document.body.appendChild( widgetDomContainer );
         widgetPrivateApi.renderTo( widgetDomContainer );

         return widgetDomContainer.firstChild;
      }

   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var testing = {
      createSetupForWidget: createSetupForWidget,
      widget: widget,
      runSpec: null,
      eventBus: null,
      tearDown: tearDown,
      triggerStartupEvents: triggerStartupEvents
   };

   var widgetDomContainer;
   var widgetPrivateApi = {};
   var path = ax._tooling.path;

   ax._tooling.eventBus.init( helpers.legacyQ(), eventBusTick, eventBusTick );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var jasmineRunner;
   var specContextLoaded = new Promise( function( resolve, reject ) {
      testing.runSpec = function( specConf, jasmineEnv ) {
         if( specConf.title ) {
            document.title = specConf.title;
         }

         var specUrl = specConf.specUrl || dirname( window.location.href );
         var specBase = path.relative( require.toUrl( '.' ), specUrl );
         var specPrefix = specBase[0] === '.' ? '' : './';

         var tests = specConf.tests.map( function( test ) {
            return specPrefix + path.join( specBase, test );
         } );

         jasmineRunner = jasmineBoot.create( jasmineEnv || null );

         // For AngularJS widgets to work, we need to load angular-mocks at this stage. This is because it
         // checks for the presence of jasmine and if found, adds a beforeEach block. If we would load it
         // later, beforeEach blocks would already have been called and AngularJS modules would not have been
         // loaded.
         helpers.require( [ 'angular-mocks' ] )
            .then( helpers.require.bind( null, tests ) )
            .then( function() {
               resolve( {
                  jasmineEnv: jasmineRunner.env,
                  absSpecLocation: specUrl
               } );
               jasmineRunner.run();
            } )
            .catch( function( err ) {
               if( window.console && window.console.error ) {
                  window.console.error( err );
               }

               reject( err );
               jasmineRunner.env.beforeEach( function() {
                  jasmineRunner.env.fail( err );
               } );
               jasmineRunner.run();
            } );
      };
   } );



   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates the setup function for a widget test. The returned function is asynchronous and should simply be
    * passed to `beforeEach`. By doing so, the handling of the Jasmine `done` callback happens under the hood.
    * To receive the widget descriptor (i.e. the contents of the `widget.json` file) the use of the RequireJS
    * *json* plugin is advised.
    *
    * Example:
    * ```js
    * define( [
    *    'json!../widget.json',
    *    'laxar-testing'
    * ], function( descriptor, testing ) {
    *    'use strict';
    *
    *    describe( 'An ExampleWidget', function() {
    *
    *       beforeEach( testing.createSetupForWidget( descriptor ) );
    *
    *       // ... widget configuration, loading and your tests
    *
    *       afterEach( testing.tearDown );
    *
    *    } );
    * } );
    * ```
    *
    * @param {Object} widgetDescriptor
    *    the widget descriptor (taken from `widget.json`)
    * @param {Object} [optionalOptions]
    *    optional map of options
    * @param {Array} optionalOptions.knownMissingResources
    *    list of file name parts as strings or regular expressions, that are known to be absent and as such
    *    won't be found by the file resource provider and thus result in the logging of a 404 HTTP error.
    *    So whenever such an error is logged and the absence of the file is fine, an appropriate entry can be
    *    added to this configuration. Mostly CSS files are affected by this
    *
    * @return {Function}
    *    a function to directly pass to `beforeEach`, accepting a Jasmine `done` callback
    */
   function createSetupForWidget( widgetDescriptor, optionalOptions ) {

      var options = ax.object.options( optionalOptions, {
         knownMissingResources: []
      } );

      var adapterFactory = ax._tooling.widgetAdapters
         .getFor( widgetDescriptor.integration.technology );
      var applyViewChanges = adapterFactory.applyViewChanges ? adapterFactory.applyViewChanges : function() {};

      return function( done ) {
         testing.eventBus = ax._tooling.eventBus.create();
         testing.eventBus.flush = function() {
            flushEventBusTicks();
            applyViewChanges();
         };
         specContextLoaded
            .then( function( specContext ) {
               specContext.eventBus = testing.eventBus;
               specContext.options = options;
               return widgetSpecInitializer
                  .createSetupForWidget( specContext, testing.widget, widgetPrivateApi, widgetDescriptor );
            } )
            .catch( handleErrorForJasmine )
            .then( done );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Removes any DOM fragments of the widget and calls the appropriate destructors. It is advised to call
    * this once in an `afterEach` call. Passing this function directly to `afterEach` works as well.
    *
    * Example.
    * ```js
    * afterEach( testing.tearDown );
    * ```
    */
   function tearDown() {
      widgetPrivateApi.destroy();
      if( widgetDomContainer && widgetDomContainer.parentElement ) {
         widgetDomContainer.parentElement.removeChild( widgetDomContainer );
         widgetDomContainer = null;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var defaultEvents = ( function() {
      var sortIndexCounter = 0;
      return {
         didChangeLocale: {
            AX_SORT_INDEX: sortIndexCounter++,
            'default': {
               locale: 'default',
               languageTag: 'en'
            }
         },
         didChangeTheme: {
            AX_SORT_INDEX: sortIndexCounter++,
            'default': {
               theme: 'default'
            }
         },
         beginLifecycleRequest: {
            AX_SORT_INDEX: sortIndexCounter++,
            'default': {
               lifecycleId: 'default'
            }
         },
         didChangeAreaVisibility: {
            AX_SORT_INDEX: sortIndexCounter++,
            'content.true': {
               area: 'content',
               visible: true
            }
         },
         didNavigate: {
            AX_SORT_INDEX: sortIndexCounter++,
            testing: {
               place: 'testing',
               target: '_self',
               data: {}
            }
         }
      };
   } )();

   /**
    * Triggers all events normally published by the runtime after instantiation of the controller. This
    * includes the following events, listed with their according payloads in the order they are published:
    *
    * **1. didChangeLocale.default:**
    * ```js
    * {
    *    locale: 'default',
    *    languageTag: 'en'
    * }
    * ```
    * **2. didChangeTheme.default:**
    * ```js
    * {
    *    theme: 'default'
    * }
    * ```
    * **3. beginLifecycleRequest.default:**
    * ```js
    * {
    *    lifecycleId: 'default'
    * }
    * ```
    * **4. didChangeAreaVisibility.content.true:**
    * ```js
    * {
    *    area: 'content',
    *    visible: true
    * }
    * ```
    * **5. didNavigate.testing:**
    * ```js
    * {
    *    place: 'testing',
    *    target: '_self',
    *    data: {}
    * }
    * ```
    *
    * Via the `optionalEvents` argument it is possible to add events with different trailing topics, to
    * overwrite events defined above, or to completely prevent from triggering one of the events. To do so
    * simply pass a map, where the primary topics are the keys and the value is a map from trailing topic to
    * payload. If the value is `null`, the specific event is not published.
    *
    * Example:
    * ```js
    * testing.triggerStartupEvents( {
    *    didChangeLocale: {
    *       alternative: {
    *          locale: 'alternative',
    *          languageTag: 'de'
    *       }
    *    },
    *    didChangeTheme: {
    *       'default': null
    *    },
    *    didNavigate: {
    *       testing: {
    *          place: 'testing',
    *          target: '_self',
    *          data: {
    *             user: 'Peter',
    *             articleId: '1234'
    *          }
    *       }
    *    }
    * } );
    * ```
    *
    * The effect of this call is the following:
    * 1. There will be two *didChangeLocale* events: *didChangeLocale.default*, carrying the language tag *en*
    *    in its payload, and *didChangeLocale.alternative*, carrying the language tag *de* in its payload.
    * 2. There will be no *didChangeTheme* event, since the only pre-configured one is set to `null`.
    * 3. The parameters of the *didNavigate.testing* event are changed to be
    *    `{ user: 'Peter', articleId: '1234' }`.
    *
    * @param {Object} [optionalEvents]
    *    optional map of user defined events
    *
    */
   function triggerStartupEvents( optionalEvents ) {
      var userEvents = optionalEvents || {};
      Object.keys( defaultEvents )
         .sort( function( eventNameA, eventNameB ) {
            return defaultEvents[ eventNameA ].AX_SORT_INDEX - defaultEvents[ eventNameB ].AX_SORT_INDEX;
         } )
         .map( function( primaryTopic ) {
            var userEventInfo = userEvents[ primaryTopic ] || {};
            var eventInfo = ax.object.extend( {}, defaultEvents[ primaryTopic ], userEventInfo );
            delete eventInfo.AX_SORT_INDEX;
            return {
               primaryTopic: primaryTopic,
               subtopics: eventInfo
            };
         } )
         .forEach( function( event ) {
            Object.keys( event.subtopics )
               .forEach( function( topicRemainder ) {
                  var payload = event.subtopics[ topicRemainder ];
                  if( payload ) {
                     testing.eventBus.publish( event.primaryTopic + '.' + topicRemainder, payload );
                  }
               } );
            testing.eventBus.flush();
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function dirname( file ) {
      return file.substr( 0, file.lastIndexOf( '/' ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var scheduledFunctions = [];
   function eventBusTick( func ) {
      scheduledFunctions.push( func );
   }

   function flushEventBusTicks() {
      while( scheduledFunctions.length > 0 ) {
         var funcs = scheduledFunctions.slice( 0 );
         scheduledFunctions = [];
         funcs.forEach( function( func ) { func(); } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function handleErrorForJasmine( err ) {
      if( window.console && window.console.error ) {
         window.console.error( err );
      }
      jasmine.getEnv().fail( err );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function configurePromisePolyfill() {
      // First search for fast alternatives to internal tick of native Promise
      if( typeof window.setImmediate === 'function' ) {
         Promise._setImmediateFn( window.setImmediate );
      }
      else if( typeof MessageChannel !== 'undefined' ) {
         // Taken from Q:
         // https://github.com/kriskowal/q/blob/0428c15d2ffc8e874b4be3a50e92884ef8701a6f/q.js#L125-141
         // Copyright 2009-2012 Kris Kowal under the terms of the MIT
         var channel = new MessageChannel();
         // linked list of tasks (single, with head node)
         var head = {}, tail = head;
         channel.port1.onmessage = function () {
            var next = head.next;
            var task = next.task;
            head = next; task();
         };

         Promise._setImmediateFn( function (task) {
            tail = tail.next = {task: task};
            channel.port2.postMessage();
         } );
      }
      else {
         // If nothing else helps:
         // get a mock free reference to setTimeout before someone mocks it on the window object
         var windowSetTimeout = window.setTimeout;
         Promise._setImmediateFn( function( callback ) {
            windowSetTimeout( callback, 0 );
         } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return testing;

} );