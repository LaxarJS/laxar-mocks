# LaxarJS Mocks [![Build Status](https://travis-ci.org/LaxarJS/laxar-mocks.svg?branch=master)](https://travis-ci.org/LaxarJS/laxar-mocks)

> The companion testing framework for LaxarJS widgets.

Use *LaxarJS Mocks* on top of Jasmine to setup and load a widget just like in an actual application.
The available APIs then support you in instrumenting and inspecting the widget under test.

For an introduction to *LaxarJS Mocks* have a look at the [manuals](docs/manuals/index.md).
Additionally the [API docs](docs/api/laxar-mocks.js.md) provide detailed information on the configuration, instrumentation and inspection possibilities.


## Getting Started

*Warning:* This is the *development branch.*
You may want to browse the [LaxarJS Mocks release documentation](http://laxarjs.org/docs/laxar-mocks-latest/).


## Installation

You can use LaxarJS Mocks to test widgets in-browser, for example using webpack and the [webpack-jasmine-html-runner-plugin](https://www.npmjs.com/package/webpack-jasmine-html-runner-plugin), or in headless mode using [karma](http://karma-runner.github.io/1.0/index.html).

Usually, it is easiest to use the `spec-loader` bundled with `laxar-mocks` so that your spec tests are automatically bundled together with their assets.

```js
{
   test: /.spec.jsx?$/,
   exclude: /(node_modules|bower_components)/,
   loader: 'laxar-mocks/spec-loader'
}
```

Then, simply write regular Jasmine 2 tests, and use the [LaxarJS Mocks API](docs/api/laxar-mocks.md) to instantiate your widgets.


### Hacking the library

Instead of using a pre-compiled library within a project, you can also clone this repository:

```sh
git clone https://github.com/LaxarJS/laxar-mocks.git
cd laxar-mocks
npm install
```

To see changes in your application, either configure your project to work with the sources (e.g. by using webpack), or rebuild the webpack bundles by running `npm run dist`.

To run the automated karma tests:

```sh
npm test
```

To generate HTML spec runners for opening in your web browser, so that you can e.g. use the browser's developer tools:

```sh
npm run browser-spec
```

Now you can select a spec-runner by browsing to http://localhost:8082/spec-output/.
