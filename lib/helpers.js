/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'require'
], function( require ) {
   'use strict';

   function requireWithPromise( requirements, optionalContextBoundRequire ) {
      return new Promise( function( resolve, reject ) {
         ( optionalContextBoundRequire || require )( requirements, function( /* modules */ ) {
            resolve( Array.prototype.slice.call( arguments, 0 ) );
         }, function( err ) {
            reject( new Error( err ) );
         } );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function legacyQ() {
      // for now our core is stuck to the legacy q api with defer and such, as it uses $q from AngularJS 1.x
      return {
         defer: defer,
         all: Promise.all.bind( Promise ),
         resolve: Promise.resolve.bind( Promise ),
         reject: Promise.reject.bind( Promise ),
         when: Promise.resolve.bind( Promise )
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function defer() {
      var deferred = {};
      deferred.promise = new Promise( function( resolve, reject ) {
         deferred.resolve = resolve;
         deferred.reject = reject;
      } );
      return deferred;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      require: requireWithPromise,
      legacyQ: legacyQ
   };

} );
