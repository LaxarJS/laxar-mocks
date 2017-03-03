
# <a id="laxar-mocks"></a>laxar-mocks

A testing framework for LaxarJS widgets.

## Contents

**Module Members**

- [TEST_WIDGET_ID](#TEST_WIDGET_ID)
- [init()](#init)
- [tearDown()](#tearDown)
- [triggerStartupEvents()](#triggerStartupEvents)
- [setupForWidget()](#setupForWidget)
- [createSetupForWidget()](#createSetupForWidget)

**Types**

- [Widget](#Widget)
  - [Widget.configure()](#Widget.configure)
  - [Widget.whenServicesAvailable()](#Widget.whenServicesAvailable)
  - [Widget.load()](#Widget.load)
  - [Widget.render()](#Widget.render)

## Module Members

#### <a id="TEST_WIDGET_ID"></a>TEST_WIDGET_ID `String`

The ID used for the widget instance loaded in the test environment.

#### <a id="init"></a>init( specFixtures )

Allows to provide assets and configuration to be used for testing a widget.

This should be used by tooling such as the LaxarJS spec-loader to specify spec fixtures in advance.

Options passed by the spec-test to [`#setupForWidget`](#setupForWidget) will take precedence over these values.

When using the spec-loader, something like the following code will be generated:

```js
( require( 'laxar-mocks' ).init( {
   descriptor: require( '../widget.json' ),
   artifacts: require( 'laxar-loader?widget=example-widget' ),
   adapter: require( 'laxar-' + fixtures.descriptor.integration.technology + '-adapter' )
} );
// ... spec test code ...
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| specFixtures | `Object` |  modules and artifacts that are required for running the widget spec test |
| specFixtures.descriptor | `Object` |  the widget's JSON descriptor, containing name, integration and feature validation schema |
| specFixtures.artifacts | `Object` |  an artifacts listing containing modules and assets for the widget under test and its required controls. Usually generated using the `laxar-tooling` library, or the `laxar-loader` for webpack |
| _specFixtures.adapter_ | `Object` |  an adapter module for the integration technology of the widget under test. Omit for "plain" widgets |

#### <a id="tearDown"></a>tearDown( done, optionalOptions )

Removes any DOM fragments of the widget and calls the appropriate destructors. It is advised to call
this once in an `afterEach` call. Passing this function directly to `afterEach` works as well and is
recommended to ensure that cleanup of the test case does not interfere with the followup test.

Example.
```js
afterEach( axMocks.tearDown );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| done | `Function` |  done callback for asynchronous teardown. Omitting this should not break laxar-mocks, but is discouraged |
| _optionalOptions_ | `Object` |  optional map of options |
| _optionalOptions.publishEndLifecycleRequest=true_ | `Object` |  if set to true (default), publish the endLifecycleRequest event to give the widget under test an opportunity to clean up between test runs. You may want to disable this in order to manually test the cleanup behavior in a dedicated test case |

#### <a id="triggerStartupEvents"></a>triggerStartupEvents( optionalEvents )

Triggers all events normally published by the runtime after instantiation of the controller. This
includes the following events, listed with their payloads in the order they are published:

###### Default Lifecycle Events

**1. didChangeLocale.default:**
```js
{
   locale: 'default',
   languageTag: 'en'
}
```

**2. beginLifecycleRequest.default:**
```js
{
   lifecycleId: 'default'
}
```

**3. didChangeAreaVisibility.content.true:**
```js
{
   area: 'content',
   visible: true
}
```

**4. didNavigate.testing:**
```js
{
   place: 'testing',
   target: '_self',
   data: {}
}
```

###### Customizing the Lifecycle Events

Via the `optionalEvents` argument it is possible to add events with different topic suffixes, to
overwrite events defined above, or to completely prevent from triggering any of the events. To do so
pass a map, where the primary topics are the keys where each value is a map from topic suffix to
payload. If the value is `null`, the specific event is not published.

Example:
```js
axMocks.triggerStartupEvents( {
   beginLifecycleRequest: {
      'default': null
   },
   didChangeLocale: {
      alternative: {
         locale: 'alternative',
         languageTag: 'de'
      }
   },
   didNavigate: {
      testing: {
         place: 'testing',
         target: '_self',
         data: {
            user: 'Peter',
            articleId: '1234'
         }
      }
   }
} );
```

The effect of this call is the following:
1. No *beginLifecycleRequest* event is published, since the only pre-configured one is set to `null`.
2. There will be two *didChangeLocale* events: *didChangeLocale.default*, carrying the language tag *en*
   in its payload, and *didChangeLocale.alternative*, carrying the language tag *de* in its payload.
3. The parameters of the *didNavigate.testing* event are changed to be
   `{ user: 'Peter', articleId: '1234' }`.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| _optionalEvents_ | `Object` |  optional map of user defined events |

#### <a id="setupForWidget"></a>setupForWidget( optionalOptions )

Creates the setup function for a widget test, using fixtures that were provided through [`#init`](#init).

This is the recommended way to setup your widget test. For this to work without manully providing options,
this module's `init` method must must have been called already, providing `descriptor`, `adapter` and
`artifacts`.

When webpack loads spec-tests through the `laxar-mocks/spec-loader`, fixtures are provided automatically.
To manually provide these fixtures, controlling every aspect of your test environment, pass them using the
named `optionalOptions` parameter.

The returned function is asynchronous and should simply be passed to `beforeEach`. By doing so, the Jasmine
`done` callback is handled under the hood.

###### Example (ES 2015) `example-widget.spec.js`:

```js
import * as axMocks from 'laxar-mocks';

describe( 'An ExampleWidget', () => {
   beforeEach( testing.setupForWidget() );
   // ... widget configuration, loading and your tests ...
   afterEach( axMocks.tearDown );
} );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| _optionalOptions_ | `Object` |  optional map of options |
| _optionalOptions.adapter=undefined_ | `Object` |  a widget-adapter matching the integration technology of the widget; omit if "plain" |
| _optionalOptions.artifacts={}_ | `Object` |  artifacts listing for this widget and its controls. Because it is hard to manually produce this correctly, using the laxar-mocks spec-loader is recommended |
| _optionalOptions.configuration={ baseHref: '/' }_ | `Object` |  mock configuration data to use for the `axConfiguration` injection of the widget |
| _optionalOptions.descriptor={}_ | `Object` |  the contents of this widget's `widget.json`, including the JSON schema for the widget features |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  a function to directly pass to `beforeEach`, accepting a Jasmine `done` callback |

#### <a id="createSetupForWidget"></a>createSetupForWidget( descriptor, optionalOptions )

Creates the setup function for a widget test, using user-provided fixtures.

This function exists for backwards compatibility with LaxarJS v1. It is recommended to use
[`#setupForWidget`](#setupForWidget) instead, which does not expect the user to provide descriptor, artifacts listing
and adapter module and instead relies on external tooling (such as the `laxar-mocks/spec-loader`).

The returned function is asynchronous and should simply be passed to `beforeEach`. By doing so, the Jasmine
`done` callback is handled under the hood.

**Note:** This method has been deprecated. Use [`#setupForWidget`](#setupForWidget) instead.

### Example (ES 2015) `example-widget.spec.js`:

```js
import * as axMocks from 'laxar-mocks';

describe( 'An ExampleWidget', () => {
   beforeEach( testing.createSetupForWidget( descriptor, {
      artifacts: {
         // ... should be generated, see laxar-tooling project for details ...
      },
      adapter: require( 'laxar-my-adapter' )
   } ) );

   // ... widget configuration, loading and your tests ...

   afterEach( axMocks.tearDown );
} );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| descriptor | `Object` |  the widget descriptor (taken from `widget.json`) |
| _optionalOptions_ | `Object` |  optional map of options |
| _optionalOptions.adapter=laxar.plainAdapter_ | `Object` |  a technology adapter to use for this widget. When using a custom integration technology (something other than "plain" or "angular"), pass the adapter module using this option. |
| _optionalOptions.artifacts={}_ | `Object` |  an artifacts listing containing all assets for the widget and its controls |
| _optionalOptions.configuration={}_ | `Object` |  mock configuration data to use for the `axConfiguration` injection of the widget |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  a function to directly pass to `beforeEach`, accepting a Jasmine `done` callback |

## Types

### <a id="Widget"></a>Widget

The API to instrument and inspect the widget under test. In addition to the listed methods it has all
injections for the specific widget technology set as properties. E.g. for every widget technology there
will be `axEventBus` and `axContext` properties, but for AngularJS widgets there will be an additional
`$scope` property. Note that these are only available after `load()` has been called and the widget
controller is loaded.

The methods of the event bus instance available as `axEventBus` are already provided with
[Jasmine spies](http://jasmine.github.io/2.3/introduction.html#section-Spies).

#### <a id="Widget.configure"></a>Widget.configure( keyOrConfiguration, optionalValue )

Allows the user to configures the widget features before loading.

Configuration may be specified using
 - a configuration object, similar to a `features` key within a page descriptor,
 - a combination of feature path and value, allowing to conveniently override individual values.

Shorthands may be used:

```js
beforeEach( () => {
   testing.widget.configure( 'search.resource', 'search' );
} );
```

If no previous configuration was given for other `search` sub-keys, this is equivalent to the following:

```js
beforeEach( () => {
   testing.widget.configure( {
      search: {
         resource: 'search'
      }
   } );
} );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| keyOrConfiguration | `String`, `Object` |  either an object for the full features configuration or the path to the property to configure |
| _optionalValue_ | `*` |  if `keyOrConfiguration` is a string, this is the value to set the feature configuration to |

#### <a id="Widget.whenServicesAvailable"></a>Widget.whenServicesAvailable( callback )

Allows the user to configures an additional callback, to be run when widget services are available.

To register multiple callbacks (for example, from nested beforeEach blocks), call this method multiple
times.
Callbacks will be executed  when the widget services are available, just before instantiating the
widget controller. They will be executed with a single parameter: the object of named injections,
usually the mock implementations. Just like at runtime, injections will be instantiated on access. The
registered callbacks can configure these injections, or replace them with custom (mock) objects.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| callback | `Function` |  a callback to be run |

#### <a id="Widget.load"></a>Widget.load( done )

Loads the given widget and instantiates its controller. As this function is asynchronous, it receives
a Jasmine `done` callback that is called when the widget is ready.

The instance ID (`axContext.widget.id`) for widgets loaded by laxar-mocks is always `testWidget`.
Their containing widget area is always `content`.

The simplest way to call this function is by passing it to its own `beforeEach` call:
```js
beforeEach( testing.widget.load );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| done | `Function` |  callback to notify Jasmine that the asynchronous widget loading has finished |

#### <a id="Widget.render"></a>Widget.render()

Renders the widget's template by calling the appropriate widget adapter and appends it within a
container div to the test's DOM. The widget DOM fragement will be returned in order to simulate
user interaction on it. Calling `tearDown()` will remove it again.

Note that calling this method for an activity has no effect and hence is unnessecary.

##### Returns

| Type | Description |
| ---- | ----------- |
| `Node` |  the widget DOM fragment |
