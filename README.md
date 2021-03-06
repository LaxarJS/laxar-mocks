# LaxarJS Mocks [![Build Status](https://travis-ci.org/LaxarJS/laxar-mocks.svg?branch=master)](https://travis-ci.org/LaxarJS/laxar-mocks)

> The companion testing framework for LaxarJS widgets.

<span class="laxar-external-documentation-hint">
   Take a look at the <a href="https://www.laxarjs.org/docs/laxar-mocks-latest">documentation site</a> to browse documentation for all releases of this artifact.
</span>


## What is LaxarJS Mocks?

*LaxarJS Mocks* simplifies writing tests for [LaxarJS](https://laxarjs.org) widgets, and helps running them.

It is a library that allows you to instantiate a testing sandbox for widgets, and that helps you to mock the services and the lifecycle events that LaxarJS provides.
Use *LaxarJS Mocks* on top of Jasmine to setup and load a widget just like in an actual application.
The available APIs then support you in instrumenting and inspecting the widget under test.

Although most widgets only have little direct dependency on *LaxarJS* (often they use only its event bus) and should mostly follow the best practices for their rendering technology such as [AngularJS](https://www.laxarjs.org/docs/laxar-angular-adapter-latest), [React](https://www.laxarjs.org/docs/laxar-react-adapter-latest) or [Vue.js](https://www.laxarjs.org/docs/laxar-vue-adapter-latest), they rely on a specific setup process provided by the LaxarJS runtime and tools.

This setup process includes
 - acquiring relevant assets (such as templates and stylesheets),
 - providing configuration and services (such as the event bus),
 - creation of the controller and rendering at the right time,
 - publishing the initial lifecycle events.

*LaxarJS Mocks* provides a programmatic interface to control this process and to load a widget within a test.
It comes with the `laxar-mocks/spec-loader` for webpack, which makes sure that all controls and assets required for a widget test are collected, and that the appropriate adapter is loaded.

For an introduction to *LaxarJS Mocks* and details on test runner setup, have a look at the [manuals](docs/manuals/index.md).
Additionally the [API docs](docs/api/laxar-mocks.md) provide detailed information on the configuration, instrumentation and inspection options.


## Getting Started

Usually, LaxarJS projects are started from the [Yeoman Generator for LaxarJS 2.x](https://laxarjs.org/docs/generator-laxarjs2-latest/), which automatically sets up LaxarJS Mocks for you, along with webpack and karma.
If you need to perform a manual setup, for example as part of upgrading a LaxarJS 1.x project, there is an additional [setup manual](docs/manuals/setup.md).


### Hacking the Library

Instead of using a pre-compiled library within a project, you can also clone this repository:

```console
git clone https://github.com/LaxarJS/laxar-mocks.git
cd laxar-mocks
npm install
```

To see changes in your application, either configure your project to work with the sources (e.g. by using webpack), or rebuild the webpack bundles by running `npm run dist`.

To run the automated karma tests:

```console
npm test
```

To generate HTML spec runners for opening in your web browser, so that you can e.g. use the browser's developer tools:

```console
npm start
```

Now you open the spec-runner by browsing to http://localhost:8081/dist/spec/laxar-mocks.spec.html.
