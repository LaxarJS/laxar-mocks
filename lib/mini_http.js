/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar'
], function( ax ) {
   'use strict';

   var cache = {};

   function get( url, optionalHeaders ) {
      var headers = optionalHeaders || {};
      var xhr = new XMLHttpRequest();

      if( url in cache ) {
         return cache[ url ];
      }

      cache[ url ] = new Promise( function( resolve, reject ) {
         xhr.onreadystatechange = function() {
            try {
               if( xhr.readyState === 4 ) {
                  if( xhr.status >= 200 && xhr.status <= 299 ) {
                     resolve( {
                        data: xhr.responseText,
                        status: xhr.status
                     } );
                  }
                  else {
                     reject( {
                        message: 'Failed to load file: ' + url,
                        data: xhr.responseText,
                        status: xhr.status,
                        xhr: xhr
                     } );
                  }
                  xhr.onreadystatechange = null;
                  xhr = null;
               }
            }
            catch( e ) {
               reject( e );
            }
         };

         xhr.open( 'GET', url , true );
         xhr.setRequestHeader( 'Cache-Control', 'no-cache' );

         Object.keys( headers ).forEach( function( headerKey ) {
            xhr.setRequestHeader( headerKey, headers[ headerKey ] );
         } );

         xhr.send( null );
      } );

      return cache[ url ];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function getJson( url, optionalHeaders ) {
      var headers = ax.object.options( optionalHeaders, { 'Accept': 'application/json' } );

      return get( url, headers )
         .then( function( response ) {
            return JSON.parse( response.data );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      get: get,
      head: get, // sufficient for tests
      getJson: getJson
   };

} );