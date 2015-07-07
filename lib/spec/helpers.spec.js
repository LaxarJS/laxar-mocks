/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../helpers'
], function( helpers ) {
   'use strict';

   describe( 'helpers', function() {
      var resolveSpy;
      var rejectSpy;

      beforeEach( function() {
         resolveSpy = jasmine.createSpy( 'resolveSpy' );
         rejectSpy = jasmine.createSpy( 'rejectSpy' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( '.legacyQ()', function() {

         var legacyQ;
         beforeEach( function() {
            legacyQ = helpers.legacyQ();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns a Q-like object', function() {
            expect( typeof legacyQ.when ).toEqual( 'function' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'can create deferred-like objects', function() {
            var deferred = legacyQ.defer();

            expect( typeof deferred.resolve ).toEqual( 'function' );
            expect( typeof deferred.reject ).toEqual( 'function' );
            expect( typeof deferred.promise ).toEqual( 'object' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where resolve works like Promise resolve', function( done ) {
            var deferred = legacyQ.defer();
            deferred.promise
               .then( resolveSpy, rejectSpy )
               .then( function() {
                  expect( rejectSpy ).not.toHaveBeenCalled();
                  expect( resolveSpy ).toHaveBeenCalledWith( 'value' );
                  done();
               } );
            deferred.resolve( 'value' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where reject works like Promise reject', function( done ) {
            var deferred = legacyQ.defer();
            deferred.promise
               .then( resolveSpy, rejectSpy )
               .then( function() {
                  expect( rejectSpy ).toHaveBeenCalledWith( 'err' );
                  expect( resolveSpy ).not.toHaveBeenCalled();
                  done();
               } );
            deferred.reject( 'err' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( '.require()', function() {

         var promise;
         beforeEach( function( done ) {
            promise = helpers.require( [ 'laxar-testing' ] );
            promise.then( resolveSpy, rejectSpy ).then( done );
         } );

         it( 'returns a promise for the module to load', function() {
            expect( typeof promise.then ).toEqual( 'function' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'resolves the promise with an array for the loaded module', function() {
            expect( rejectSpy ).not.toHaveBeenCalled();
            var loadedModules = resolveSpy.calls.first().args[0];
            expect( loadedModules[0] ).toEqual( jasmine.objectContaining( {
               runSpec: jasmine.any( Function )
            } ) );
         } );

      } );
      
   } );

} );
