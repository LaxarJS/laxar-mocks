[<< return to the manuals](index.md)

# Introduction LaxarJS Testing

*LaxarJS Testing* aids you in writing tests for *LaxarJS* widgets.
Although widgets themselves only have little direct dependency on *LaxarJS* (apart from the event bus) and should mostly follow the best practices for the underlying technology (e.g. *AngularJS*), they depend on a fixed setup process provided by the LaxarJS runtime.
This includes loading of relevant assets (such as templates and stylesheets), creation of the controller and rendering at the right time, as well as sending all initially relevant events.

*LaxarJS Testing* provides a simple, programmatic interface to control this process and load a widget within a test.
We'll introduce the testing framework by showing an example and use this to describe the individual steps usually found in a widget test.

This is a simple test for an *AngularJS*-Widget:
```js
// 1. Module Definition
define( [
   'json!../widget.json',
   'laxar-testing',
   'angular-mocks'
], function( descriptor, testing, ngMocks ) {
   'use strict';

   describe( 'An ExampleWidget', function() {

      var $httpBackend;
      var widgetDom;

      // 2. Test Setup
      beforeEach( testing.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'ax-i18n-control.css' ]
      } ) );
      
      // 3. Widget Configuration
      beforeEach( function() {
         testing.widget.configure( {
            example: {
               resource: 'exampleResource',
               action: 'exampleAction'
            }
         } );
      } );
      
      // 4. Loading the Widget
      beforeEach( testing.widget.load );
      
      beforeEach( function() {
         // 5. Optional: Rendering the Widget DOM
         widgetDom = testing.widget.render();

         // 6. Optional: Mocking an AngularJS Injection
         ngMocks.inject( function( $injector ) {
            $httpBackend = $injector.get( '$httpBackend' );
         } );

         // 7.  Optional: Simulating Startup Events
         testing.triggerStartupEvents();
      } );

      // 8. Tests
      it( 'subscribes to didReplace events for the search resource', function() {
         expect( testing.widget.axEventBus.subscribe )
            .toHaveBeenCalledWith( 'didReplace.exampleResource', jasmine.any( Function ) );
      } );

      // 9. Test Tear-Down
      afterEach( testing.tearDown );
      
   } );
   
} );
```


## 1. Module Definition

In the AMD module definition for a widget test the first thing to depend on should usually be the widget descriptor (the contents of the `widget.json` file).
This is the only information LaxarJS Testing needs to determine the relevant widget and according assets to load.
We recommend using the *json* plugin for *RequireJS* to load the file hassle-free just as done in this example.

Additionally *LaxarJS Testing* needs to be loaded, to gain access to the API for widget loading, instrumentation and inspection.
When using the default *RequireJS* configuration for that package, it should be available as `laxar-testing`.
The import of `angular-mocks` should only take place, if it is really needed during testing.
In this example we want to use the mocked `$httpBackend` provided by *AngularJS Mocks* and thus need to import `angular-mocks`.


## 2. Test Setup

Due to a bunch of HTTP requests that need to take place, setting up a widget test is an asynchronous task.
To spare the user the handling of asynchronous tasks in the *Jasmine* environment, `testing.createSetupForWidget( descriptor )` returns an asynchronous function suitable for use with `beforeEach`.
Besides the widget descriptor, it can optionally receive a map of configuration options.

### Available Options ###

#### *knownMissingResources*

A list of file name parts that are known to be absent.
If left unspecified, the runtime's file resource provider would try to fetch these assets for widgets and controls through HTTP, resulting in 404 errors being logged.
So whenever you see such an error in the log and decide that the absence of the corresponding file is fine, an appropriate entry can be added to this configuration.
The list entries can be strings or regular expressions.
Regular expressions are tested against requested file names, while strings will match any file name that contains them anywhere.

In this example the widget uses the *i18n* control.
We already know that there is no theme, and hence no CSS file for this control, as it only provides some APIs and has no visual representation.
When loading the widget from a running application, the generated file listing would yield that the file is absent and it wouldn't be loaded.
During testing we have to give that hint manually, as seen in this example.

Further information can be found in the [api docs](../api/laxar-testing.js.md#createSetupForWidget).


## 3. Widget Configuration

In the next step we configure the features of the widget, just as it normally happens in a page definition.
The object you'd put under the key `features` can simply be passed to the method `testing.widget.configure`.
For convenience it's also possible to use an object attribute path and a single value as arguments.
This is e.g. useful if the widget gets pre-configured in an outer `describe` block and is adjusted deeper in a nested structure.

So here we could have also written this:
```js
beforeEach( function() {
   testing.widget.configure( 'example.resource', 'exampleResource' );
   testing.widget.configure( 'example.action', 'exampleAction' );
} );
```


## 4. Loading the Widget

Here we tell the widget loader to actually load the widget controller.
Since the API of the widget loader is asynchronous, the `load` method is asynchronous as well and thus expects a *Jasmine* `done` callback.
Again, to keep it as simple as possible for the user, the `load` method doesn't need to be called directly, but can simply be passed on to `beforeEach`
Make sure to load the widget only when all configuration has been applied, because afterwards calls to `testing.widget.configure` have no effect.


## 5. Optional: Rendering the Widget DOM

Naturally this step does not apply to activities, since they do not influence the DOM and in particular have no visual representation.
Calling the `testing.widget.render()` for activities isn't harmful, but simply has no effect at all.
In case of a widget, the template is compiled by the underlying technology adapter, wrapped in a `div` element and the resulting DOM node returned.
This is not different from the rendering process in a regular application.
Instead of appending the DOM to a widget area, it is appended to the body element of the test.
It is removed again before the next test run would render its DOM or when calling `testing.tearDown`.


## 6. Optional: Mocking an AngularJS Injection

For this example, we assume that we're testing an *AngularJS* widget, which performs some backend communication, using the `$http` service provided by *AngularJS*.
*AngularJS Mocks* aids us in this case, by providing the instrumentation API `$httpBackend`.
To prevent from going too much into detail, the [AngularJS Mocks API](https://code.angularjs.org/1.4.1/docs/api/ngMock) should be your source of information in that regard.


## 7.  Optional: Simulating Startup Events

When a page within a *LaxarJS* application loads, the runtime publishes several initial events.
Many widgets don't actually care for these events and only subscribe to custom events such as *didReplace* or *takeActionRequest*.
Other widgets may depend on [core events](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/events.md#core-patterns) like *didChangeLocale* or *didNavigate* with certain parameters.

In order to be able to test a widgets response to core events without duplicating too much of this task within every test, the method `testing.triggerStartupEvents` publishes all events the runtime would publish in the correct order.
The method allows to configure parts of these events or skip some of them completely.
For further information on event configuration have a look at the extensive [API docs](../api/laxar-testing.js.md#triggerStartupEvents).


## 8. Tests

Now you're set up to write your actual tests.
At this point the widget controller is instantiated, the (optional) DOM fragment has been rendered and all relevant runtime events were published.

Probably you want to group your tests into functional use cases via *Jasmine* `describe` functions.
In this case it is sometimes a good thing to postpone the calls to `testing.widget.load`, `testing.widget.render` and `testing.triggerStartupEvents`.
It is then possible to structure the test in isolated `describe` blocks, to adjust the configuration for each block as needed and only afterwards call the other methods to actually fire up your tests.


## 9. Test Tear-Down

Every widget test should call `testing.tearDown` in a *Jasmine* `afterEach` block or simply pass it to `afterEach`.
This ensures, that after one test is run, the DOM is cleaned up and the widget with all its dependencies is destroyed.
If this is omitted, it cannot be guaranteed that remainders of the previous test run do not influence the current test run.