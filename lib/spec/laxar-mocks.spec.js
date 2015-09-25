/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar-mocks'
], function( axMocks ) {
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
            triggerStartupEvents: anyFunction
         } ) );
      } );

      // Providing more tests would be nice, but mocking will be very hard and error-prone. Hence usefulness
      // of such tests would be really questionable.

   } );

} );