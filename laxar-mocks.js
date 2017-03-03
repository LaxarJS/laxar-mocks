/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * A testing framework for LaxarJS widgets.
 *
 * @module laxar-mocks
 */
import { assert, bootstrap, plainAdapter, object } from 'laxar';
import {
   createAxAreaHelperMock,
   createAxAssetsMock,
   createAxConfigurationMock,
   createAxEventBusMock,
   createAxFlowServiceMock,
   createAxGlobalStorageMock,
   createAxHeartbeatMock,
   createAxI18nMock,
   createAxLogMock,
   createAxStorageMock,
   createAxVisibilityMock
} from 'laxar/laxar-widget-service-mocks';

import { create as createAjv } from 'laxar-tooling/lib/ajv';

const widgetPrivateApi = {};

// The AngularJS adapter messes with the regular Promise API.
// To guarantee AngularJS-free scheduling of `widget.render` we need to hold on to the original.
const Promise = window.Promise;
const nextTick = f => {
   Promise.resolve().then( f );
};

const noOp = () => {};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The ID used for the widget instance loaded in the test environment.
 *
 * @name TEST_WIDGET_ID
 * @type {String}
 */
export const TEST_WIDGET_ID = 'test-widget';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

let fixtures = {};

/**
 * Allows to provide assets and configuration to be used for testing a widget.
 *
 * This should be used by tooling such as the LaxarJS spec-loader to specify spec fixtures in advance.
 *
 * Options passed by the spec-test to {@link #setupForWidget} will take precedence over these values.

 * When using the spec-loader, something like the following code will be generated:
 *
 * ```js
 * ( require( 'laxar-mocks' ).init( {
 *    descriptor: require( '../widget.json' ),
 *    artifacts: require( 'laxar-loader?widget=example-widget' ),
 *    adapter: require( 'laxar-' + fixtures.descriptor.integration.technology + '-adapter' )
 * } );
 * // ... spec test code ...
 * ```
 *
 * @param {Object} specFixtures
 *    modules and artifacts that are required for running the widget spec test
 * @param {Object} specFixtures.descriptor
 *    the widget's JSON descriptor, containing name, integration and feature validation schema
 * @param {Object} specFixtures.artifacts
 *    an artifacts listing containing modules and assets for the widget under test and its required controls.
 *    Usually generated using the `laxar-tooling` library, or the `laxar-loader` for webpack
 * @param {Object} [specFixtures.adapter]
 *    an adapter module for the integration technology of the widget under test. Omit for "plain" widgets
 */
export function init( specFixtures ) {
   assert( specFixtures.descriptor ).hasType( Object ).isNotNull();
   assert( specFixtures.artifacts ).hasType( Object ).isNotNull();
   assert( specFixtures.artifacts.widgets ).hasType( Array ).isNotNull();
   assert( specFixtures.artifacts.aliases ).hasType( Object ).isNotNull();
   if( specFixtures.adapter ) {
      assert( specFixtures.adapter.technology ).hasType( String ).isNotNull();
      assert( specFixtures.adapter.bootstrap ).hasType( Function ).isNotNull();
   }
   fixtures = specFixtures;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export let eventBus;

let adapterInstancePromise;
let adapter;
let anchorElement;
let artifacts;
let configuration;
let laxarServices;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
 * @constructor
 * @name Widget
 */
export const widget = {

   /**
    * Allows the user to configures the widget features before loading.
    *
    * Configuration may be specified using
    *  - a configuration object, similar to a `features` key within a page descriptor,
    *  - a combination of feature path and value, allowing to conveniently override individual values.
    *
    * Shorthands may be used:
    *
    * ```js
    * beforeEach( () => {
    *    testing.widget.configure( 'search.resource', 'search' );
    * } );
    * ```
    *
    * If no previous configuration was given for other `search` sub-keys, this is equivalent to the following:
    *
    * ```js
    * beforeEach( () => {
    *    testing.widget.configure( {
    *       search: {
    *          resource: 'search'
    *       }
    *    } );
    * } );
    * ```
    *
    * @param {String|Object} keyOrConfiguration
    *    either an object for the full features configuration or the path to the property to configure
    * @param {*} [optionalValue]
    *    if `keyOrConfiguration` is a string, this is the value to set the feature configuration to
    *
    * @memberof Widget
    */
   configure( keyOrConfiguration, optionalValue ) {
      if( !widgetPrivateApi.configure ) {
         throw new Error( 'laxar-mocks: setupForWidget needs to be called prior to configure.' );
      }
      widgetPrivateApi.configure( keyOrConfiguration, optionalValue );
   },

   /**
    * Allows the user to configures an additional callback, to be run when widget services are available.
    *
    * To register multiple callbacks (for example, from nested beforeEach blocks), call this method multiple
    * times.
    * Callbacks will be executed  when the widget services are available, just before instantiating the
    * widget controller. They will be executed with a single parameter: the object of named injections,
    * usually the mock implementations. Just like at runtime, injections will be instantiated on access. The
    * registered callbacks can configure these injections, or replace them with custom (mock) objects.
    *
    * @param {Function} callback
    *    a callback to be run
    *
    * @memberof Widget
    */
   whenServicesAvailable( callback ) {
      if( !widgetPrivateApi.whenServicesAvailable ) {
         throw new Error( 'laxar-mocks: setupForWidget needs to be called prior to whenServicesAvailable.' );
      }
      widgetPrivateApi.whenServicesAvailable( callback );
   },

   /**
    * Loads the given widget and instantiates its controller. As this function is asynchronous, it receives
    * a Jasmine `done` callback that is called when the widget is ready.
    *
    * The instance ID (`axContext.widget.id`) for widgets loaded by laxar-mocks is always `testWidget`.
    * Their containing widget area is always `content`.
    *
    * The simplest way to call this function is by passing it to its own `beforeEach` call:
    * ```js
    * beforeEach( testing.widget.load );
    * ```
    *
    * @param {Function} done
    *    callback to notify Jasmine that the asynchronous widget loading has finished
    *
    * @memberof Widget
    */
   load( done ) {
      if( !widgetPrivateApi.load ) {
         throw new Error( 'laxar-mocks: createSetupForWidget needs to be called prior to load.' );
      }
      if( typeof done !== 'function' ) {
         throw new Error( 'laxar-mocks: widget.load must be called with a Jasmine done-callback function.' );
      }
      widgetPrivateApi.load()
         .catch( handleErrorForJasmine )
         .then( () => nextTick( done ) );
   },

   /**
    * Renders the widget's template by calling the appropriate widget adapter and appends it within a
    * container div to the test's DOM. The widget DOM fragement will be returned in order to simulate
    * user interaction on it. Calling `tearDown()` will remove it again.
    *
    * Note that calling this method for an activity has no effect and hence is unnessecary.
    *
    * @return {Node}
    *    the widget DOM fragment
    *
    * @memberof Widget
    */
   render() {
      widgetPrivateApi.renderTo( anchorElement );
      return anchorElement.firstChild;
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function decoratedAdapter( adapter ) {
   return {
      technology: adapter.technology,
      bootstrap( artifacts, services, domRoot ) {
         laxarServices = services;
         eventBus = createAxEventBusMock( { errorHandler: handleErrorForJasmine } );
         const adapterFactory = adapter.bootstrap( artifacts, services, domRoot );
         return {
            ...adapterFactory,
            serviceDecorators: createServiceDecoratorsFactory( adapterFactory ),
            create( ...args ) {
               adapterInstancePromise = Promise.resolve( adapterFactory.create( ...args ) );
               return adapterInstancePromise;
            }
         };
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createServiceDecoratorsFactory( adapterFactory ) {
      return function serviceDecorators() {
         return {
            ...( adapterFactory.serviceDecorators || noOp )(),
            axAreaHelper: () => createAxAreaHelperMock( { widget: { id: TEST_WIDGET_ID } } ),
            axAssets: () => {
               const { assets } = artifacts.widgets[ 0 ];
               return createAxAssetsMock( assets );
            },
            axConfiguration: () => createAxConfigurationMock( configuration ),
            axEventBus: eventBus => {
               const methods = [ 'subscribe', 'publish', 'publishAndGatherReplies', 'addInspector' ];
               methods.forEach( method => {
                  spyOn( eventBus, method ).and.callThrough();
               } );
               return eventBus;
            },
            axFlowService: () => createAxFlowServiceMock(),
            axGlobalEventBus: () => eventBus,
            axGlobalLog: () => createAxLogMock(),
            axGlobalStorage: () => createAxGlobalStorageMock(),
            axHeartbeat: () => createAxHeartbeatMock(),
            axI18n: i18n => createAxI18nMock( i18n ),
            axLog: () => createAxLogMock(),
            axStorage: () => createAxStorageMock(),
            axVisibility: () => createAxVisibilityMock( { eventBus, widget: { area: 'content' } } )
         };
      };
   }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Removes any DOM fragments of the widget and calls the appropriate destructors. It is advised to call
 * this once in an `afterEach` call. Passing this function directly to `afterEach` works as well and is
 * recommended to ensure that cleanup of the test case does not interfere with the followup test.
 *
 * Example.
 * ```js
 * afterEach( axMocks.tearDown );
 * ```
 *
 * @param {Function} done
 *    done callback for asynchronous teardown. Omitting this should not break laxar-mocks, but is discouraged
 * @param {Object} [optionalOptions]
 *    optional map of options
 * @param {Object} [optionalOptions.publishEndLifecycleRequest=true]
 *    if set to true (default), publish the endLifecycleRequest event to give the widget under test an
 *    opportunity to clean up between test runs. You may want to disable this in order to manually test the
 *    cleanup behavior in a dedicated test case
 */
export function tearDown( done, optionalOptions = {} ) {
   const { publishEndLifecycleRequest = true } = optionalOptions;
   if( publishEndLifecycleRequest ) {
      eventBus.publish( 'endLifecycleRequest.default', { lifecycleId: 'default' } );
      eventBus.flush();
   }
   nextTick( () => {
      widgetPrivateApi.destroy();
      if( anchorElement && anchorElement.parentElement ) {
         anchorElement.parentElement.removeChild( anchorElement );
         anchorElement = null;
      }
      if( done ) {
         done();
      }
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

const defaultEvents = [
   {
      topic: 'didChangeLocale',
      subtopics: {
         'default': {
            locale: 'default',
            languageTag: 'en'
         }
      }
   },
   {
      topic: 'beginLifecycleRequest',
      subtopics: {
         'default': {
            lifecycleId: 'default'
         }
      }
   },
   {
      topic: 'didChangeAreaVisibility',
      subtopics: {
         'content.true': {
            area: 'content',
            visible: true
         }
      }
   },
   {
      topic: 'didNavigate',
      subtopics: {
         testing: {
            place: 'testing',
            target: '_self',
            data: {}
         }
      }
   }
];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Triggers all events normally published by the runtime after instantiation of the controller. This
 * includes the following events, listed with their payloads in the order they are published:
 *
 * ###### Default Lifecycle Events
 *
 * **1. didChangeLocale.default:**
 * ```js
 * {
 *    locale: 'default',
 *    languageTag: 'en'
 * }
 * ```
 *
 * **2. beginLifecycleRequest.default:**
 * ```js
 * {
 *    lifecycleId: 'default'
 * }
 * ```
 *
 * **3. didChangeAreaVisibility.content.true:**
 * ```js
 * {
 *    area: 'content',
 *    visible: true
 * }
 * ```
 *
 * **4. didNavigate.testing:**
 * ```js
 * {
 *    place: 'testing',
 *    target: '_self',
 *    data: {}
 * }
 * ```
 *
 * ###### Customizing the Lifecycle Events
 *
 * Via the `optionalEvents` argument it is possible to add events with different topic suffixes, to
 * overwrite events defined above, or to completely prevent from triggering any of the events. To do so
 * pass a map, where the primary topics are the keys where each value is a map from topic suffix to
 * payload. If the value is `null`, the specific event is not published.
 *
 * Example:
 * ```js
 * axMocks.triggerStartupEvents( {
 *    beginLifecycleRequest: {
 *       'default': null
 *    },
 *    didChangeLocale: {
 *       alternative: {
 *          locale: 'alternative',
 *          languageTag: 'de'
 *       }
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
 * 1. No *beginLifecycleRequest* event is published, since the only pre-configured one is set to `null`.
 * 2. There will be two *didChangeLocale* events: *didChangeLocale.default*, carrying the language tag *en*
 *    in its payload, and *didChangeLocale.alternative*, carrying the language tag *de* in its payload.
 * 3. The parameters of the *didNavigate.testing* event are changed to be
 *    `{ user: 'Peter', articleId: '1234' }`.
 *
 * @param {Object} [optionalEvents]
 *    optional map of user defined events
 *
 */
export function triggerStartupEvents( optionalEvents = {} ) {
   defaultEvents
      .map( ({ topic, subtopics }) => ({
         topic,
         subtopics: { ...subtopics, ...optionalEvents[ topic ] }
      }) )
      .forEach( ({ topic, subtopics }) => {
         Object.keys( subtopics )
            .filter( key => subtopics[ key ] != null )
            .forEach( key => {
               eventBus.publish( `${topic}.${key}`, subtopics[ key ] );
            } );
         eventBus.flush();
      } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the setup function for a widget test, using fixtures that were provided through {@link #init}.
 *
 * This is the recommended way to setup your widget test. For this to work without manully providing options,
 * this module's `init` method must must have been called already, providing `descriptor`, `adapter` and
 * `artifacts`.
 *
 * When webpack loads spec-tests through the `laxar-mocks/spec-loader`, fixtures are provided automatically.
 * To manually provide these fixtures, controlling every aspect of your test environment, pass them using the
 * named `optionalOptions` parameter.
 *
 * The returned function is asynchronous and should simply be passed to `beforeEach`. By doing so, the Jasmine
 * `done` callback is handled under the hood.
 *
 * ###### Example (ES 2015) `example-widget.spec.js`:
 *
 * ```js
 * import * as axMocks from 'laxar-mocks';
 *
 * describe( 'An ExampleWidget', () => {
 *    beforeEach( testing.setupForWidget() );
 *    // ... widget configuration, loading and your tests ...
 *    afterEach( axMocks.tearDown );
 * } );
 * ```
 *
 * @param {Object} [optionalOptions]
 *    optional map of options
 * @param {Object} [optionalOptions.adapter=undefined]
 *    a widget-adapter matching the integration technology of the widget; omit if "plain"
 * @param {Object} [optionalOptions.artifacts={}]
 *    artifacts listing for this widget and its controls. Because it is hard to manually produce this
 *    correctly, using the laxar-mocks spec-loader is recommended
 * @param {Object} [optionalOptions.configuration={ baseHref: '/' }]
 *    mock configuration data to use for the `axConfiguration` injection of the widget
 * @param {Object} [optionalOptions.descriptor={}]
 *    the contents of this widget's `widget.json`, including the JSON schema for the widget features
 *
 * @return {Function}
 *    a function to directly pass to `beforeEach`, accepting a Jasmine `done` callback
 */
export function setupForWidget( optionalOptions = {} ) {
   assert( optionalOptions ).hasType( Object );
   const setupFixtures = { configuration: { baseHref: '/' }, ...fixtures, ...optionalOptions };
   ({ adapter = plainAdapter, artifacts, configuration = {} } = setupFixtures);
   const { descriptor } = setupFixtures;

   assert( artifacts ).isNotNull(
      'laxar-mocks.setupForWidget: *artifacts* must be set as fixture (use spec-loader) or passed as option'
   );
   assert( adapter ).isNotNull(
      'laxar-mocks.setupForWidget: the *adapter* option must not be set to null'
   );
   assert( configuration ).isNotNull(
      'laxar-mocks.setupForWidget: the *configuration* option must not be set to null'
   );
   assert( descriptor ).isNotNull(
      'laxar-mocks.setupForWidget: *descriptor* must be set as fixture (use spec-loader) or passed as option'
   );

   return done => {
      let htmlTemplate;
      let features = {};
      let loadContext;

      assert.state(
         adapter.technology === descriptor.integration.technology,
         `laxar-mocks: Widget is using technology "${descriptor.integration.technology}", ` +
         `but adapter is for "${adapter.technology}". ` +
         'Pass the correct adapter as option "adapter" to `createSetupForWidget`.'
      );

      if( anchorElement && anchorElement.parentElement ) {
         anchorElement.parentElement.removeChild( anchorElement );
      }
      anchorElement = document.createElement( 'DIV' );
      anchorElement.id = 'widgetContainer';
      document.body.appendChild( anchorElement );

      bootstrap( anchorElement, {
         widgetAdapters: [ decoratedAdapter( adapter ) ],
         configuration,
         artifacts
      } );
      let adapterInstance;

      widgetPrivateApi.configure = ( keyOrConfiguration, optionalValue ) => {
         if( typeof keyOrConfiguration === 'string' ) {
            object.setPath( features, keyOrConfiguration, optionalValue );
         }
         else {
            features = object.deepClone( keyOrConfiguration );
         }
      };

      const whenServicesAvailableCallbacks = [];
      widgetPrivateApi.whenServicesAvailable = callback => {
         whenServicesAvailableCallbacks.push( callback );
      };

      widgetPrivateApi.load = done =>

         laxarServices.widgetLoader.load( {
            id: TEST_WIDGET_ID,
            widget: descriptor.name,
            features: validate( features, descriptor )
         }, {
            whenServicesAvailable( services ) {
               // Grab the widget injections and make them available to tests.
               // Do this lazily to avoid creating services that where not actually injected.
               Object.keys( services ).forEach( k => {
                  delete widget[ k ];
                  Object.defineProperty( widget, k, {
                     configurable: true,
                     get: () => services[ k ]
                  } );
               } );
               whenServicesAvailableCallbacks.forEach( f => f( services ) );
            }
         } )
         .then( _ => {
            loadContext = _;
            // ugly workaround for Promise/$q interop
            if( descriptor.integration.technology === 'angular' ) {
               laxarServices.heartbeat.onNext( () => {} );
            }
            return loadContext.templatePromise;
         } )
         .then( _ => {
            htmlTemplate = _;
            return adapterInstancePromise;
         } )
         .then( _ => {
            adapterInstance = _;
         } )
         .then( done );

      widgetPrivateApi.destroy = () => {
         if( loadContext ) {
            loadContext.destroy();
            loadContext = null;
         }
         if( adapter.reset ) {
            adapter.reset();
         }
      };

      widgetPrivateApi.renderTo = container => {
         adapterInstance.domAttachTo( container, htmlTemplate );
      };

      done();
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the setup function for a widget test, using user-provided fixtures.
 *
 * This function exists for backwards compatibility with LaxarJS v1. It is recommended to use
 * {@link #setupForWidget} instead, which does not expect the user to provide descriptor, artifacts listing
 * and adapter module and instead relies on external tooling (such as the `laxar-mocks/spec-loader`).
 *
 * The returned function is asynchronous and should simply be passed to `beforeEach`. By doing so, the Jasmine
 * `done` callback is handled under the hood.
 *
 * **Note:** This method has been deprecated. Use {@link #setupForWidget} instead.
 *
 * ### Example (ES 2015) `example-widget.spec.js`:
 *
 * ```js
 * import * as axMocks from 'laxar-mocks';
 *
 * describe( 'An ExampleWidget', () => {
 *    beforeEach( testing.createSetupForWidget( descriptor, {
 *       artifacts: {
 *          // ... should be generated, see laxar-tooling project for details ...
 *       },
 *       adapter: require( 'laxar-my-adapter' )
 *    } ) );
 *
 *    // ... widget configuration, loading and your tests ...
 *
 *    afterEach( axMocks.tearDown );
 * } );
 * ```
 *
 * @deprecated use {@link #setupForWidget} instead
 *
 * @param {Object} descriptor
 *    the widget descriptor (taken from `widget.json`)
 * @param {Object} [optionalOptions]
 *    optional map of options
 * @param {Object} [optionalOptions.adapter=laxar.plainAdapter]
 *    a technology adapter to use for this widget.
 *    When using a custom integration technology (something other than "plain" or "angular"), pass the
 *    adapter module using this option.
 * @param {Object} [optionalOptions.artifacts={}]
 *    an artifacts listing containing all assets for the widget and its controls
 * @param {Object} [optionalOptions.configuration={}]
 *    mock configuration data to use for the `axConfiguration` injection of the widget
 *
 * @return {Function}
 *    a function to directly pass to `beforeEach`, accepting a Jasmine `done` callback
 */
export function createSetupForWidget( descriptor, optionalOptions = {} ) {
   if( window.console && window.console.warn ) {
      window.console.warn(
         'laxar-mocks: DEPRECATION: `createSetupForWidget( args )` should be changed to `setupForWidget()`'
      );
   }
   optionalOptions.descriptor = descriptor;
   return setupForWidget( optionalOptions );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function validate( features, descriptor ) {
   const newFeatures = object.deepClone( features );
   if( descriptor.features ) {
      const jsonSchema = createAjv();
      const validate = jsonSchema.compile(
         descriptor.features,
         descriptor.name,
         { isFeaturesValidator: true }
      );

      const valid = validate( newFeatures );
      if( !valid ) {
         throw jsonSchema.error( `Validation failed for widget "${descriptor.name}"`, validate.errors );
      }
   }
   return newFeatures;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleErrorForJasmine( err, moreInformation ) {
   if( window.console && window.console.error ) {
      window.console.error( err, moreInformation );
   }
   jasmine.getEnv().fail( err );
}
