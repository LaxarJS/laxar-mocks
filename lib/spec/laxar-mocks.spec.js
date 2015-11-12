/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar',
   'laxar-mocks'
], function( ax, axMocks ) {
   'use strict';

   describe( 'laxar-mocks', function() {

      var anyFunction = jasmine.any( Function );
      var anyObject = jasmine.any( Object );

      it( 'defines an api', function() {
         expect( axMocks ).toEqual( jasmine.objectContaining( {
            eventBus: anyObject,
            widget: anyObject,
            createSetupForWidget: anyFunction,
            runSpec: anyFunction,
            tearDown: anyFunction,
            triggerStartupEvents: anyFunction,
            configureMockDebounce: anyFunction
         } ) );
      } );


      describe( 'asked to mock laxar.fn.debounce', function() {

         beforeEach( function() {
            axMocks.configureMockDebounce();
         } );

         it( 'provides a flush-method', function() {
            expect( ax.fn.debounce.flush ).toEqual( jasmine.any( Function ) );
         } );

         describe( 'and pending debounced calls', function() {

            var debouncee;
            var wrapper;
            beforeEach( function() {
               debouncee = jasmine.createSpy( 'debouncee' );
               wrapper = ax.fn.debounce( debouncee, 10 );
               wrapper( 'shall pass' );
               wrapper( 'shall not pass' );
            } );

            it( 'calls the installed _setTimeout mock', function() {
               expect( ax.fn._setTimeout ).toHaveBeenCalled();
            } );

            describe( 'asked to flush', function() {
               beforeEach( function() {
                  ax.fn.debounce.flush();
               } );

               it( 'runs debounced calls (once)', function() {
                  expect( debouncee ).toHaveBeenCalled();
               } );

               it( 'passes arguments to the debouncee', function() {
                  expect( debouncee ).toHaveBeenCalledWith( 'shall pass' );
               } );

               it( 'does not run the same debouncee multiple times', function() {
                  expect( debouncee ).not.toHaveBeenCalledWith( 'shall not pass' );
               } );
            } );

            describe( 'after a timeout (without flush)', function() {
               it( 'does not run the debouncee', function( done ) {
                  window.setTimeout( function() {
                     expect( debouncee ).not.toHaveBeenCalled();
                     done();
                  }, 20 );
               } );
            } );

         } );

      } );

      describe( '*not* asked to mock laxar.fn.debounce', function() {

         describe( 'with pending debounced calls', function() {
            var debouncee;
            var wrapper;
            beforeEach( function() {
               debouncee = jasmine.createSpy( 'debouncee' );
               wrapper = ax.fn.debounce( debouncee, 10 );
               wrapper( 'shall pass' );
               wrapper( 'shall not pass' );
            } );

            describe( 'without a sufficient timeout (without flush)', function() {

               it( 'does not run the debouncee', function( done ) {
                  window.setTimeout( function() {
                     expect( debouncee ).toHaveBeenCalled();
                     done();
                  }, 10 );
               } );

            } );

            describe( 'after a timeout (without flush)', function() {

               it( 'runs the debouncee to support async testing', function( done ) {
                  window.setTimeout( function() {
                     expect( debouncee ).toHaveBeenCalled();
                     done();
                  }, 20 );
               } );

            } );

         } );

      } );

      // Providing more tests would be nice, but mocking will be very hard and error-prone. Hence usefulness
      // of such tests would be really questionable.

   } );

} );
