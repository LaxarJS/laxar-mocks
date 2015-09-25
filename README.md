# LaxarJS Mocks [![Build Status](https://travis-ci.org/LaxarJS/laxar-mocks.svg?branch=master)](https://travis-ci.org/LaxarJS/laxar-mocks)

> The companion testing framework for LaxarJS widgets.

Use *LaxarJS Mocks* on top of Jasmine to setup and load a widget just like in an actual application.
The available APIs then support you in instrumenting and inspecting the widget under test.

For an introduction to *LaxarJS Mocks* have a look at the [manuals](docs/manuals/index.md).
Additionally the [API docs](docs/api/laxar-mocks.js.md) provide detailed information on the configuration, instrumentation and inspection possibilities.


## Installation

Your LaxarJS application might have been created from a template that already includes _laxar-mocks_ (check your `bower_components` folder).
If not, follow these steps:

1. Install `laxar-mocks` as a Bower dependency:

```console
bower install --save-dev laxar-mocks
```

2. Add the necessary entries to your RequireJS configuration (`require_config.js`), assuming that your `baseUrl` is `'bower_components'`:

```js
paths: {
   // requirejs, laxar, angular, angular-mocks...

   // laxar-mocks specific paths:
   'laxar-mocks': 'laxar-mocks/dist/laxar-mocks',
   jasmine2: 'jasmine2/lib/jasmine-core/jasmine',
   'promise-polyfill': 'promise-polyfill/Promise'
}
```

Note that _Jasmine 2_ is installed by Bower into its own directory to support [different versions of jasmine](docs/manuals/jasmine-compatibility.md) to be used by different widgets.
