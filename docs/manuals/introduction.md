[« return to the manuals](index.md)

# Introduction to LaxarJS Mocks

*LaxarJS Mocks* simplifies writing and helps running tests for *LaxarJS* widgets.

It is a library that allows you to instantiate a testing sandbox for widgets, and that helps you to mock the services and the lifecycle events that LaxarJS provides.

Although most widgets only have little direct dependency on *LaxarJS* (often they use only the event bus) and should mostly follow the best practices for their rendering technology (such as [AngularJS](https://github.com/LaxarJS/laxar-angular-adapter), [React](https://github.com/LaxarJS/laxar-react-adapter) or [Vue.js](https://github.com/LaxarJS/laxar-vue-adapter)), they rely on a specific setup process provided by the LaxarJS runtime.

This setup process includes
 - acquiring relevant assets (such as templates and stylesheets),
 - creation of the controller and rendering at the right time,
 - publishing the initial lifecycle events.

*LaxarJS Mocks* provides a programmatic interface to control this process and to load a widget within a test.
It comes with the `laxar-mocks/spec-loader` for webpack, which makes sure that all controls and assets required for a widget test are collected, and that the appropriate adapter is loaded.


## An Example Test

Before going into details on setup and running tests, we will introduce the testing framework by showing an example and use this to describe the individual steps usually found in a widget test.

The following is a simple test for a *plain* widget.
Consult your adapter's documentation to find any additional information for your integration technology.

Below the example, each of the enumerated points is described in more detail.
If you are already familiar with the basics, you may want to browse the [API docs](../api/laxar-mocks.md). instead.

```js
// 1. Module Definition / Import LaxarJS Mocks
import * as axMocks from 'laxar-mocks';

describe( 'An ExampleWidget', () => {

   let widgetDom;

   // 2. Prepare the Test Setup, to create axMocks.widget for the widget under test
   beforeEach( axMocks.setupForWidget() );

   beforeEach( () => {
      // 3. Widget Configuration (as needed by the widget)
      axMocks.widget.configure( {
         example: {
            resource: 'exampleResource',
            action: 'exampleAction'
         }
      } );

      // 4. Optional: Configuring and/or replacing Widget Services
      axMocks.widget.whenServicesAvailable( services => {
         services.axFlowService.constructAbsoluteUrl.andCallFake( target =>
            target === 'next' ? '/step2.html' : '/other.html';
         );
         services.axId = suffix => `customPrefix-${suffix}`;
      } );
   } );

   // 5. Loading the Widget, and instantiating the controller
   beforeEach( axMocks.widget.load );

   beforeEach( () => {
      // 6.  Optional: Simulating Startup Events
      axMocks.triggerStartupEvents();

      // 7. Optional: Rendering the Widget DOM
      widgetDom = axMocks.widget.render();
   } );

   // 8. Tests
   it( 'subscribes to didReplace events for the example resource', () => {
      expect( axMocks.widget.axEventBus.subscribe )
         .toHaveBeenCalledWith( 'didReplace.exampleResource', jasmine.any( Function ) );
      expect( axMocks.widget.axFlowService.constructAbsoluteUrl )
         .toHaveBeenCalledWith( 'next', {} );
   } );

   // 9. DOM-Tests
   it( 'renders a link pointing to the "next" target', () => {
      expect( widgetDom.querySelector( 'a' ).href ).toEqual( '/step2.html' );
      expect( widgetDom.querySelector( 'input' ).id ).toEqual( 'customPrefix-myInput' );
      expect( widgetDom.querySelector( 'label' ).for ).toEqual( 'customPrefix-myInput' );
   } );

   // 10. Test Tear-Down
   afterEach( axMocks.tearDown );

} );
```

Now to the step-by-step explanation:

### 1. Imports

For simplicity, this test is written as an ES2015 module, but other styles (CommonJS, AMD) should work just fine.
The LaxarJS spec-loader takes care of loading the widget itself and its dependencies, such as controls.


### 2. Test Setup

LaxarJS mocks has already been provisioned with information on the widget's assets, so no arguments need to be passed here
To spare the user from handling of asynchronous tasks in the *Jasmine* environment, `axMocks.setupForWidget()` returns an asynchronous function suitable for use with `beforeEach`.


## 3. Widget Configuration

In the next step we configure the features of the widget.
The same information that you would configure as `features` within a page when developing an application can be passed to the method `axMocks.widget.configure`.
For convenience it's also possible to use an object attribute path and a single value as arguments.
This is especially useful if the widget gets pre-configured in an outer `describe` block and is adjusted deeper in a nested structure.

This means that alternatively we could have written:

```js
beforeEach( () => {
   axMocks.widget.configure( 'example.resource', 'exampleResource' );
   axMocks.widget.configure( 'example.action', 'exampleAction' );
} );
```


## 4. Optional: Mocking Widget Services

Because LaxarJS Mocks automatically injects service mocks with Jasmine spies for all widget services provided by LaxarJS, you will often be able to skip this step.
In this case, we'd like to tests the URLs generated by the widget, so we modify the `axFlowService` mock to generate URLs of our choosing, that we can check against our expectations below.


## 5. Loading the Widget

Here we tell the widget loader to actually instantiate the widget controller.
Since the API of the widget loader is asynchronous, the `widget.load` method is asynchronous as well and thus expects a *Jasmine* `done` callback.
Again, to keep tests simple, the `load` method doesn't need to be called directly, but can be passed directly to `beforeEach`.
Make sure to load the widget only *after* all configuration and service mocks have been prepared, because afterwards calls to `widget.configure` and `widget.whenServicesAvailable` have no effect.


## 6. Optional: Simulating Startup Events

When a page within a *LaxarJS* application loads, the runtime publishes several initial events.
Many widgets don't actually care for these events and only subscribe to custom events such as *didReplace* or *takeActionRequest*.
Other widgets may depend on [core events](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/events.md#core-patterns) like *didChangeLocale* or *didNavigate* with certain parameters.

For testing a widget's response to core events without duplicating too much of the associated logic within every test, the function `triggerStartupEvents` publishes all events that the runtime would publish, in the same order.

The method also allows to modify these events or skip some of them completely.
For further information on event configuration have a look at the [API docs](../api/laxar-mocks.md#triggerStartupEvents).


## 7. Optional: Rendering the Widget DOM

Naturally this step does not apply to activities, since they do not influence the DOM and in particular have no visual representation.
Calling `widget.render()` for activities isn't harmful, but simply has no effect.

For widgets, their template is processed by the underlying technology adapter, wrapped in a `DIV` element and the resulting DOM node returned.
This is not different from the rendering process in a regular application.
Instead of appending the DOM to a widget area, it is appended to the body element of the test.
It is removed again before the next test run would render its DOM or when calling `axMocks.tearDown`.


## 8. Tests

Now you're set up to write your actual tests.
At this point the widget controller is instantiated, the (optional) DOM fragment has been rendered and all relevant runtime events were published.

Probably you want to group your tests into functional use cases via *Jasmine* `describe` functions.
In this case it is sometimes a good thing to postpone the calls to `axMocks.widget.load`, `axMocks.widget.render` and `axMocks.triggerStartupEvents`.
It is then possible to structure the test in isolated `describe` blocks, to adjust the configuration for each block as needed and only afterwards call the other methods to actually fire up your tests.


## 9. Test Tear-Down

Every widget test should call `axMocks.tearDown` in a *Jasmine* `afterEach` block or simply pass it to `afterEach` as a callback.
This ensures, that after one test is run, the DOM is cleaned up and the widget with all its dependencies is destroyed.
If this is omitted, it cannot be guaranteed that remainders of the previous test run do not influence the current test run.


## Note for Users Coming from LaxarJS v1.x

These are the major changes when coming from LaxarJS v1.x:

 - no more copy/pasting of `spec-runner.js` and `spec-runner.html`: Boilerplate and HTML test runner are now generated on-the-fly (see below for running tests in the web browser or using karma).

 - all LaxarJS services are mocked out-of-the-box: If you are using LaxarJS injections such as `axConfiguration`, `axFlowService` or `axVisibility`, these will be mocked automatically. Previously, only the `axEventBus` injection was mocked automatically. You can use a callback to configure or to replace these mocks just before creating your widget controller, as shown in the example below.

 - no more need for loading the descriptor yourself, no more need to specify `knownMissingResources` in order to avoid 404 CSS Requests: The spec-loader makes sure that all assets have already been loaded.

 - no more built-in assumptions regarding AngularJS: Neither LaxarJS Core nor LaxarJS Mocks make assumptions on wether AngularJS is used or not. Framework-specific test-code is handled by the adapters.


## Setup Instructions

It is recommended to put your widget spec tests into files with the extension `.spec.js` within a `spec` folder of each widget that you would like to test.
For example, a widget called `my-widget` would come with a `spec/my-widget.spec.js`.
This allows you to use the webpack `rules` configuration for automatically loading all widget specs through the laxar-mocks spec-loader.

Here is an example excerpt for use in a `webpack.config.js`:

```js
module.exports = {
   // ... entry, resolve, ...
   module: {
      // ... other module config ...
      rules: [
         // ... more rules ...
         {
            test: /.spec.js$/,
            loader: 'laxar-mocks/spec-loader'
         }
      ]
   }
};
```

Of course, you can also use JSX or TypeScript if your other loaders are setup accordingly.

## Running Tests using Karma

If webpack is configured as above, you can run them with karma by using [karma-webpack](https://github.com/webpack-contrib/karma-webpack) to preprocess your specs.

Here is an example excerpt for use in a `karma.config.js`:

```js
const webpackConfig = require( './webpack.config.js' );
// `entry` for test is generated by karma-webpack
delete webpackConfig.entry;
module.exports = function( config ) {
   config( {
      // ... other karma settings ...
      frameworks: [ 'jasmine' ],
      files: [ 'path/to/widget/spec/*.spec.js' ]
      preprocessors: {
         'path/to/widget/**/spec/': [ 'webpack', 'sourcemap' ]
      },
      webpack: webpackConfig
   } )
};
```

To get all the settings right, especially when you are testing many widgets in the context of a development project, it is probably simpler to get started using the [Yeoman generator](), which automatically prepares a working karma setup for your project.


## Running Tests in the Browser






# Directory Layout

If you generated your widget or activity using the latest template, everything should be set up correctly.
When creating the widget artifacts manually, we recommend the following directory layout for the tests within the widget directory:

```
example-widget
+-- example-widget.js
+-- widget.json
+-- spec
    +-- example-widget.spec.js
    +-- spec_runner.html
    +-- spec_runner.js
```

When following this structure, the AMD module definition from the top of this introduction should work for you.
You just have to ensure that paths such as `laxar-mocks` and `angular-mocks` are configured correctly, as described in the README.

When running the widget test in your browser, this is achieved by using the correct paths in the file `spec_runner.html`.
By default it is assumed that any widget directory can be found at the directory `includes/widget/<your category>/` under the application root.
The `require_config.js` of the application will then be loaded by stepping up to the parent directory five times (see [here](example/spec_runner.html) for an example).
For tests to run, at least the paths `requirejs`, `jasmine`, `laxar-mocks` and the RequireJS `json` plugin have to be defined in that file.
When testing *AngularJS* widgets, the path to `angular-mocks` must be defined as well.

The next file that is loaded is `spec_runner.js` (an example can be found [here](example/spec_runner.html)).
This file merely defines which actual test files to load and run.
These files are located relative to  `spec_runner.js`.
Optionally you can overwrite *RequireJS* configuration from the application's `require_config.js` file, by setting the appropriate entries under the property `requireConfig`.
For example, it may sometimes be a good idea to mock a large external library with a simpler stub for testing.

Finally, the module `example-widget.spec.js` defines the actual testing code.
If you're following these guidelines, the widget descriptor (`widget.json`) can also be loaded as explained in the example, so that the widget under test can be instantiated without problems.
