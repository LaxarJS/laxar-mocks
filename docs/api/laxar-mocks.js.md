
# laxar-mocks

A testing framework for LaxarJS widgets.

## Contents

**Module Members**
- [widget](#widget)
- [runSpec](#runSpec)
- [eventBus](#eventBus)
- [createSetupForWidget](#createSetupForWidget)
- [tearDown](#tearDown)
- [triggerStartupEvents](#triggerStartupEvents)
- [configureMockDebounce](#configureMockDebounce)

**Types**
- [Widget](#Widget)
  - [Widget#configure](#Widget#configure)
  - [Widget#load](#Widget#load)
  - [Widget#render](#Widget#render)

## Module Members
#### <a name="widget"></a>widget
The [Widget](#Widget) instrumentation instance for this test.
After the setup-method (provided by [createSetupForWidget](#createSetupForWidget)) has been run, this also contains
the widget's injections.

#### <a name="runSpec"></a>runSpec()
This method is used by the spec-runner (HTML- or karma-based) to start running the spec suite.

#### <a name="eventBus"></a>eventBus
The _"test end"_ of the LaxarJS event bus.
Tests should use this event bus instance to interact with the widget under test by publishing
synthetic events. Tests can also use this handle for subscribing to events published  by the widget.

There is also the event bus instance used by the widget itself, with spied-upon publish/subscribe
methods. That instance can be accessed as `axMocks.widget.axEventBus`.

#### <a name="createSetupForWidget"></a>createSetupForWidget( widgetDescriptor, optionalOptions )
Creates the setup function for a widget test. The returned function is asynchronous and should simply be
passed to `beforeEach`. By doing so, the handling of the Jasmine `done` callback happens under the hood.
To receive the widget descriptor (i.e. the contents of the `widget.json` file) the use of the RequireJS
*json* plugin is advised.

Example:
```js
define( [
   'json!../widget.json',
   'laxar-mocks'
], function( descriptor, axMocks ) {
   'use strict';

   describe( 'An ExampleWidget', function() {

      beforeEach( testing.createSetupForWidget( descriptor ) );

      // ... widget configuration, loading and your tests

      afterEach( axMocks.tearDown );

   } );
} );
```

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| widgetDescriptor | `Object` |  the widget descriptor (taken from `widget.json`) |
| _optionalOptions_ | `Object` |  optional map of options |
| _optionalOptions.adapter_ | `Object` |  a technology adapter to use for this widget. When using a custom integration technology (something other than "plain" or "angular"), pass the adapter module using this option. |
| _optionalOptions.knownMissingResources_ | `Array` |  list of file name parts as strings or regular expressions, that are known to be absent and as such won't be found by the file resource provider and thus result in the logging of a 404 HTTP error. So whenever such an error is logged and the absence of the file is fine, an appropriate entry can be added to this configuration. Mostly CSS files are affected by this |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` |  a function to directly pass to `beforeEach`, accepting a Jasmine `done` callback |

#### <a name="tearDown"></a>tearDown()
Removes any DOM fragments of the widget and calls the appropriate destructors. It is advised to call
this once in an `afterEach` call. Passing this function directly to `afterEach` works as well.

Example.
```js
afterEach( axMocks.tearDown );
```

#### <a name="triggerStartupEvents"></a>triggerStartupEvents( optionalEvents )
Triggers all events normally published by the runtime after instantiation of the controller. This
includes the following events, listed with their according payloads in the order they are published:

**1. didChangeLocale.default:**
```js
{
   locale: 'default',
   languageTag: 'en'
}
```
**2. didChangeTheme.default:**
```js
{
   theme: 'default'
}
```
**3. beginLifecycleRequest.default:**
```js
{
   lifecycleId: 'default'
}
```
**4. didChangeAreaVisibility.content.true:**
```js
{
   area: 'content',
   visible: true
}
```
**5. didNavigate.testing:**
```js
{
   place: 'testing',
   target: '_self',
   data: {}
}
```

Via the `optionalEvents` argument it is possible to add events with different trailing topics, to
overwrite events defined above, or to completely prevent from triggering one of the events. To do so
simply pass a map, where the primary topics are the keys and the value is a map from trailing topic to
payload. If the value is `null`, the specific event is not published.

Example:
```js
axMocks.triggerStartupEvents( {
   didChangeLocale: {
      alternative: {
         locale: 'alternative',
         languageTag: 'de'
      }
   },
   didChangeTheme: {
      'default': null
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
1. There will be two *didChangeLocale* events: *didChangeLocale.default*, carrying the language tag *en*
   in its payload, and *didChangeLocale.alternative*, carrying the language tag *de* in its payload.
2. There will be no *didChangeTheme* event, since the only pre-configured one is set to `null`.
3. The parameters of the *didNavigate.testing* event are changed to be
   `{ user: 'Peter', articleId: '1234' }`.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| _optionalEvents_ | `Object` |  optional map of user defined events |

#### <a name="configureMockDebounce"></a>configureMockDebounce()
Installs an `laxar.fn.debounce`-compatible mock replacement that supports manual `flush()`.
When called, `flush` will process all pending debounced calls,
Additionally, there is a `debounce.waiting` array, to inspect waiting calls.

When called from a `beforeEach` block, only a manual flush will cause debounced calls to be processed
within that block. The passing of time (wall-clock or jasmine-mock clock) will have no effect on calls
that were debounced in this context.

The mocks are automatically cleaned up after each test case.

## Types
### <a name="Widget"></a>Widget
The API to instrument and inspect the widget under test. In addition to the listed methods it has all
injections for the specific widget technology set as properties. E.g. for every widget technology there
will be `axEventBus` and `axContext` properties, but for AngularJS widgets there will be an additional
`$scope` property. Note that these are only available after `load()` has been called and the widget
controller is loaded.

The methods of the event bus instance available as `axEventBus` are already provided with
[Jasmine spies](http://jasmine.github.io/2.3/introduction.html#section-Spies).

#### <a name="Widget#configure"></a>Widget#configure( keyOrConfiguration, optionalValue )
Configures the widget features before loading with the given configuration object or key/value
entries. In fact this is what you'd normally configure under the `features` key in a page descriptor.

Shorthands may be used:

This
```js
beforeEach( function() {
   testing.widget.configure( {
      search: {
         resource: 'search'
      }
   } );
} );
```
is equivalent to the following shorter version
```js
beforeEach( function() {
   testing.widget.configure( 'search.resource', 'search' );
} );
```

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| keyOrConfiguration | `String`, `Object` |  either an object for the full features configuration or the path to the property to configure |
| _optionalValue_ | `*` |  if `keyOrConfiguration` is a string, this is the value to set the feature configuration to |

#### <a name="Widget#load"></a>Widget#load( done )
Loads the given widget and instantiates its controller. As this function is asynchronous, it receives
a Jasmine `done` callback, that is called when the widget is ready.

The instance ID (`axContext.widget.id`) for widgets loaded by laxar-mocks is always `testWidget`.

The simplest way to call this function is by passing it to its own `beforeEach` call:
```js
beforeEach( testing.widget.load );
```

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| done | `Function` |  callback to notify Jasmine, that the asynchronous widget loading has finished |

#### <a name="Widget#render"></a>Widget#render()
Renders the widget's template by calling the appropriate widget adapter and appends it within a
container div to the test's DOM. The widget DOM fragement will be returned in order to simulate
user interaction on it. Calling `testing.tearDown()` will remove it again.

Note that calling this method for an activity has no effect and hence is unnessecary.

##### Returns
| Type | Description |
| ---- | ----------- |
| `Node` |  the widget DOM fragment |
