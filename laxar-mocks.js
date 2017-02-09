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

/**
 * Can be used to specify setup-fixtures for widget/activity tests.
 *
 * Spec-runners may add entries to this map to provision widget specs with options that will automatically be
 * picked up by `setupForWidget`. For example, the laxar-mocks spec-loader for webpack puts the `artifacts`,
 * `adapter` and `descriptor` options here.
 *
 * Options passed by the spec-test to `setupForWidget` will take precedence over these values.
 *
 * @name fixtures
 * @type {Object}
 */
export const fixtures = {};

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
    * @memberOf Widget
    */
   configure( keyOrConfiguration, optionalValue ) {
      if( !widgetPrivateApi.configure ) {
         throw new Error( 'laxar-mocks: createSetupForWidget needs to be called prior to configure.' );
      }
      widgetPrivateApi.configure( keyOrConfiguration, optionalValue );
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
    * @memberOf Widget
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
    * @memberOf Widget
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
         eventBus = createAxEventBusMock();
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
            axVisibility: () => createAxVisibilityMock()
         };
      };
   }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Removes any DOM fragments of the widget and calls the appropriate destructors. It is advised to call
 * this once in an `afterEach` call. Passing this function directly to `afterEach` works as well.
 *
 * Example.
 * ```js
 * afterEach( axMocks.tearDown );
 * ```
 */
export function tearDown() {
   widgetPrivateApi.destroy();
   if( anchorElement && anchorElement.parentElement ) {
      anchorElement.parentElement.removeChild( anchorElement );
      anchorElement = null;
   }
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
      topic: 'didChangeLocale',
      subtopics: {
         'default': {
            theme: 'default'
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
 * **2. didChangeTheme.default:**
 * ```js
 * {
 *    theme: 'default'
 * }
 * ```
 *
 * **3. beginLifecycleRequest.default:**
 * ```js
 * {
 *    lifecycleId: 'default'
 * }
 * ```
 *
 * **4. didChangeAreaVisibility.content.true:**
 * ```js
 * {
 *    area: 'content',
 *    visible: true
 * }
 * ```
 *
 * **5. didNavigate.testing:**
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
 * Creates the setup function for a widget test, using externally provided fixtures.
 *
 * This is the recommended way to setup your widget test. For this to work, *this* module's `fixtures` export
 * needs to be initialized with the following properties:
 *
 *   - `descriptor` - the widget's JSON descriptor,
 *   - `adapter` - the adapter module for the widget's integration technology (use `null` for "plain"),
 *   - `artifacts` - an artifact listing containing the assets of the widget and its controls.
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
 * When using the spec-loader, something like the following code will be generated:
 *
 * ```js
 * ( fixtures => {
 *    fixtures.descriptor = require( '../widget.json' );
 *    fixtures.artifacts = require( 'laxar-loader?widget=example-widget' );
 *    fixtures.adapter = require( 'laxar-' + fixtures.descriptor.integration.technology + '-adapter' );
 * } )( require( 'laxar-mocks' ).fixtures );
 * import * as axMocks from 'laxar-mocks';
 *
 * describe( 'An ExampleWidget', () => {
 *    // ... same as above ...
 * } );
 * ```
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
            }
         } )
         .then( _ => {
            loadContext = _;
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
         throw jsonSchema.error( `Validation failed for widget "${name}"`, validate.errors );
      }
   }
   return newFeatures;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleErrorForJasmine( err ) {
   if( window.console && window.console.error ) {
      window.console.error( err );
   }
   jasmine.getEnv().fail( err );
}
