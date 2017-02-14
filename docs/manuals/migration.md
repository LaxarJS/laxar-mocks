[« return to the manuals](index.md)


## Coming from LaxarJS Mocks 1.x

These are the major changes when coming from LaxarJS Mocks version 1.x:


### Requires LaxarJS 2.x

This library works together with LaxarJS 2.x and the corresponding technology adapters.


### No More Copy/Pasting Spec-Runnner Files

Both `spec_runner.js` and `spec_runner.html` are no longer needed.

HTML and JS boilerplate code for the test runner is now generated on-the-fly, and should be removed from your repository.
Also, the HTML-runner contained hard-coded paths to Jasmine, which could cause test problems when widgets were moved around in a project -- this should no longer be a concern.
For details, refer to the [setup manual](setup.md).


### LaxarJS Services are Mocked Out-of-the-Box:

When using LaxarJS injections such as `axConfiguration`, `axFlowService` or `axVisibility`, these are now mocked automatically.
Previously, only the `axEventBus` injection was always mocked.
You can use a callback to configure or to replace these mocks just before creating your widget controller.

Also, widget services can now be interacted with *before* the widget controller is instantiated:
The new `whenServicesAvailable` hook allows to intercept and configure or replace LaxarJS widget service mocks.


### Simplified Testbed Setup

No more need for loading the descriptor yourself;
no more need to specify `knownMissingResources` in order to avoid 404 Requests for the CSS stylesheets of your widget's controls.
The spec-loader makes sure that all assets have already been loaded if and only if they exist.
Because of that, you should now use the parameterless `setupForWidget()` instead of `createSetupForWidget( descriptor, options )`.


### MVC-Agnostic

No more built-in assumptions regarding AngularJS.
Neither LaxarJS Core nor LaxarJS Mocks make assumptions on wether AngularJS is used or not.
Framework-specific test-code is handled by the adapters.
