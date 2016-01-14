/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../widget_spec_initializer'
], function( widgetSpecInitializer ) {
   'use strict';

   describe( 'widgetSpecInitializer', function() {

      var anyFunction = jasmine.any( Function );

      it( 'defines an api', function() {
         expect( widgetSpecInitializer ).toEqual( jasmine.objectContaining( {
            createSetupForWidget: anyFunction
         } ) );
      } );

      // Providing more tests would be nice, but mocking will be very hard and error-prone. Hence usefulness
      // of such tests would be really questionable.

   } );

} );
