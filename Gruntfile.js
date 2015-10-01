/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/*jshint node: true*/
module.exports = function (grunt) {
   'use strict';

   var pkg = grunt.file.readJSON( 'package.json' );
   var src = {
      gruntfile: 'Gruntfile.js',
      require: 'require_config.js',
      'laxar-mocks': [ pkg.name + '.js', 'lib/*.js', '!lib/spec/*.js' ],
      specs: [ 'lib/spec/*.js' ]
   };

   grunt.initConfig( {
      jshint: {
         options: {
            jshintrc: '.jshintrc'
         },
         gruntfile: {
            options: { node: true },
            src: src.gruntfile
         },
         'laxar-mocks': { src: src['laxar-mocks'] },
         specs: { src: src.specs }
      },
      karma: {
         options: {
            basePath: '.',
            frameworks: ['laxar'],
            reporters: ['junit', 'coverage', 'progress'],
            browsers: ['PhantomJS'],
            singleRun: true,
            preprocessors: {
               'lib/*.js': 'coverage'
            },
            proxies: {},
            files: [
               { pattern: 'bower_components/**', included: false },
               { pattern: 'lib/**', included: false },
               { pattern: '*.js', included: false }
            ]
         },
         'laxar-mocks': {
            'laxar': {
               specRunner: 'lib/spec/spec_runner.js',
               requireConfig: src.require,
               testRunner: 'laxar-mocks',
               jasmineMajorVersion: 2
            },
            junitReporter: {
               outputFile: 'lib/spec/test-results.xml'
            },
            coverageReporter: {
               type: 'lcovonly',
               dir: 'lib/spec',
               file: 'lcov.info'
            }
         }
      },
      test_results_merger: {
         'laxar-mocks': {
            src: [ 'lib/spec/test-results.xml' ],
            dest: 'test-results.xml'
         }
      },
      lcov_info_merger: {
         'laxar-mocks': {
            src: [ 'lib/spec/*/lcov.info' ],
            dest: 'lcov.info'
         }
      },
      watch: {
         gruntfile: {
            files: src.gruntfile,
            tasks: [ 'jshint:gruntfile' ]
         },
         'laxar-mocks': {
            files: src['laxar-mocks'],
            tasks: [ 'jshint:laxar-mocks', 'karma' ]
         },
         specs: {
            files: src.specs,
            tasks: [ 'jshint:specs', 'karma' ]
         }
      },
      clean: {
         apidoc: {
            src: [ 'docs/api/*.js.md' ]
         }
      },
      laxar_dox: {
         default: {
            files: [ {
               src: [
                  './laxar-mocks.js'
               ],
               dest: 'docs/api/'
            } ]
         }
      }
   } );

   grunt.loadNpmTasks( 'grunt-contrib-clean' );
   grunt.loadNpmTasks( 'grunt-contrib-jshint' );
   grunt.loadNpmTasks( 'grunt-contrib-watch' );
   grunt.loadNpmTasks( 'grunt-laxar' );

   grunt.registerTask( 'test', [ 'karma', 'test_results_merger', 'lcov_info_merger', 'jshint' ] );
   grunt.registerTask( 'apidoc', [ 'clean:apidoc', 'laxar_dox' ] );

   grunt.registerTask( 'default', [ 'test', 'apidoc' ] );
};
