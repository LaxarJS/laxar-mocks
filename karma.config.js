// Karma configuration for LaxarJS core
/* eslint-env node */

const webpackConfig = Object.assign( {}, require('./webpack.config' ) );
delete webpackConfig.entry;
delete webpackConfig.plugins;
webpackConfig.devtool = 'inline-source-map';

module.exports = function( config ) {
   const browsers = [ 'PhantomJS', 'Firefox' ].concat( [
      process.env.TRAVIS ? 'ChromeTravisCi' : 'Chrome'
   ] );

   config.set( {
      frameworks: [ 'jasmine' ],
      files: [
         require.resolve( 'laxar/dist/polyfills' ),
         'spec/*.spec.js'
      ],
      preprocessors: {
         'spec/*.spec.js': [ 'webpack', 'sourcemap' ]
      },
      webpack: webpackConfig,

      reporters: [ 'progress', 'junit' ],
      junitReporter: {
         outputDir: 'karma-output/'
      },
      port: 9876,
      browsers,
      customLaunchers: {
         ChromeTravisCi: {
            base: 'Chrome',
            flags: [ '--no-sandbox' ]
         }
      },
      browserNoActivityTimeout: 100000,
      singleRun: true,
      autoWatch: false,
      concurrency: Infinity
   } );
};
