/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

// 1. Module Definition, Imports
import * as axMocks from 'laxar-mocks';

describe( 'An ExampleWidget', () => {

   // 2. Testbed Setup, creates axMocks.widget for the widget under test
   beforeEach( axMocks.setupForWidget() );

   beforeEach( () => {
      // 3. Widget Configuration (as needed by the widget)
      axMocks.widget.configure( {
         example: {
            resource: 'exampleResource',
            action: 'exampleAction'
         }
      } );

      // 4. Optional: Configuring and/or Replacing Widget Services
      axMocks.widget.whenServicesAvailable( services => {
         services.axFlowService.constructAbsoluteUrl
            .andCallFake( target => target === 'next' ? '/step2' : '/default' );
         services.axId = suffix => `ABC-${suffix}`;
      } );
   } );

   // 5. Loading the Widget, and instantiating the controller
   beforeEach( axMocks.widget.load );

   // 6.  Optional: Simulating Startup Events
   beforeEach( axMocks.triggerStartupEvents );

   // 7. Optional: Rendering the Widget DOM
   let widgetDom;
   beforeEach( () => { widgetDom = axMocks.widget.render(); } );

   // 8. Tests
   it( 'subscribes to didReplace events for the example resource', () => {
      expect( axMocks.widget.axEventBus.subscribe )
         .toHaveBeenCalledWith( 'didReplace.exampleResource', jasmine.any( Function ) );
      expect( axMocks.widget.axFlowService.constructAbsoluteUrl )
         .toHaveBeenCalledWith( 'next', {} );
   } );

   // 9. Optional: DOM-Tests
   it( 'renders a link refering to the "next" target', () => {
      expect( widgetDom.querySelector( 'a' ).href ).toEqual( '/step2' );
   } );

   it( 'renders an input with matching label', () => {
      expect( widgetDom.querySelector( 'input' ).id ).toEqual( 'ABC-myInput' );
      expect( widgetDom.querySelector( 'label' ).for ).toEqual( 'ABC-myInput' );
   } );

   // 10. Testbed Tear-Down
   afterEach( axMocks.tearDown );

} );
