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

         it( 'can create deferreds', function() {
            var deferred = legacyQ.defer();

            expect( typeof deferred.resolve ).toEqual( 'function' );
            expect( typeof deferred.reject ).toEqual( 'function' );
            expect( typeof deferred.promise ).toEqual( 'object' );
         } );

      } );

      // NEEDS FIX C: add missing tests
      
   } );

} );
