[<< return to the manuals](index.md)

# Multiple Jasmine Versions in one Project

The LaxarJS core in Version 1.0 already ships with built-in widget testing support for [Jasmine v1.3](http://jasmine.github.io/1.3/introduction.html), which can be imported using the AMD reference `laxar/laxar_testing`.
However, in that testing framework, only widgets implemented in AngularJS are supported.
Also, the builtin testing module contains several peculiarities which are sometimes confusing:
For example, events are delivered as a side-effect of "ticking" the virtual clock.
Because of the semantic versioning model used by LaxarJS, the old testing module will stay part of the core at least until LaxarJS v2.0 is released.

For the future (starting with LaxarJS v1.1.0), the `laxar-testing` library moves testing functionality out of the core.
Besides relying on the modern [Jasmine v2.3](http://jasmine.github.io/2.3/introduction.html), this test runner allows you to test non-angular widgets, provided that you have a corresponding [adapter](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/adapters.md).
Of course, LaxarJS must support widgets using `laxar/laxar_testing` and those using `laxar-testing` _within the same application_.
This means that both types of widgets will share a set of Bower components.
To avoid jasmine version conflicts, the [HTML spec-runner](example/spec_runner.html) expects a `jasmine2` path to be configured with RequireJS in order to use laxar-testing and Jasmine v2.3.
This allows you to install jasmine versions 1.x and 2.x in the same project.
For more information on configuring _Bower_ and _RequireJS_ for _laxar-testing_, check out the _Installation_ instructions in the [README](../../README.md).

Using the [spec-runner configuration](example/spec_runner.js) you can declare the jasmine version as well as the actual test-runner module to be used.
The spec-runner configuration is respected by the HTML spec-runner as well as on the command line (when you call _grunt test_), through [karma-laxar](https://github.com/LaxarJS/karma-laxar).
This way you can choose among the testing frameworks.

## Configuring the Spec-Runner

A widget's spec-runner configuration defines a property `laxarSpec` on the global object (or on its module when running in node), with the following properties:

  - the `title` of the spec test
  - the `tests` to be run (AMD module files in the same folder)
  - the AMD module of the `testRunner` to use.
    For the future and to use jasmine 2, use `'laxar-testing'`.
    If nothing is specified, the old `'laxar/laxar_testing'` will be used.
  - the `jasmineMajorVersion` to use.
    When using `laxar-testing` as the _testRunner_, make sure to specify `2`.
    By default, the major version `1` is assumed, which will work with the old testing module.

Usually, everything you need has been setup correctly by the widget template when creating your widget.
The only time that you have to edit the spec-runner configuration is when upgrading a widget from the old builtin testing module (and Jasmine 1.3.x) to using `laxar-testing` (and Jasmine 2.3.x).
