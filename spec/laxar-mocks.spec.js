import * as axMocks from '../laxar-mocks';

describe( 'A laxar-mocks test runner', () => {

   it( 'offers to create a test setup function', () => {
      expect( axMocks.createSetupForWidget ).toEqual( jasmine.any( Function ) );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'asked to create a setup for an activity', () => {

      let descriptor;
      let artifacts;
      let configuration;
      let create;

      beforeEach( done => {
         descriptor = createFakeDescriptor( 'some-activity', 'activity' );
         create = jasmine.createSpy( 'widgetModule.create' );
         artifacts = createFakeArtifacts( descriptor, { create } );
         configuration = { baseHref: '/' };
         axMocks.createSetupForWidget( descriptor, { artifacts, configuration } )( done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not yet instantiate the controller', () => {
         expect( create ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and then to load the controller', () => {

         beforeEach( done => {
            axMocks.widget.load( done );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'instantiates the widget controller', () => {
            expect( create ).toHaveBeenCalled();
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'asked to create a setup for a widget with a lot of injections', () => {

      let descriptor;
      let artifacts;
      let configuration;
      let create;

      beforeEach( done => {
         descriptor = createFakeDescriptor( 'some-widget', 'widget', {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
               someFeature: {
                  type: 'string'
               },
               other: {
                  default: 'default'
               }
            }
         } );
         create = jasmine.createSpy( 'widgetModule.create' ).and.callFake( () => ({
            onDomAvailable: () => {}
         }) );
         artifacts = createFakeArtifacts( descriptor, {
            injections: [ 'axFeatures', 'axStorage', 'axLog', 'axConfiguration', 'axAssets' ],
            create
         } );
         configuration = { baseHref: '/' };
         axMocks.createSetupForWidget( descriptor, { artifacts, configuration } )( done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and then to re-configure and to load the controller', () => {

         beforeEach( done => {
            axMocks.widget.configure( { someFeature: 'someValue' } );
            axMocks.widget.load( done );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'instantiates the widget controller with the requested injections', () => {
            expect( create ).toHaveBeenCalled();
            const [ features, storage, log, configuration, assets ] = create.calls.mostRecent().args;
            expect( features ).toEqual( { someFeature: 'someValue', other: 'default' } );
            expect( storage.local.setItem ).toEqual( jasmine.any( Function ) );
            expect( log.info ).toEqual( jasmine.any( Function ) );
            expect( configuration.get ).toEqual( jasmine.any( Function ) );
            expect( assets ).toEqual( jasmine.any( Function ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'provides a mock-storage injection without side-effects', () => {
            expect( create ).toHaveBeenCalled();
            const storage = create.calls.mostRecent().args[ 1 ];
            storage.mockBackends.session.test = '"mockValue"';
            expect( storage.session.getItem( 'test' ) ).toEqual( 'mockValue' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'provides a mock-log injection without side-effects', () => {
            const log = create.calls.mostRecent().args[ 2 ];
            log.error( 'test error' );
            expect( log.error ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'provides a mock-configuration injection with the values given to setup', () => {
            const configuration = create.calls.mostRecent().args[ 3 ];
            expect( configuration.get( 'baseHref' ) ).toEqual( '/' );
            expect( configuration.get ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'provides a mock-assets injection with the values given to setup', done => {
            const assets = create.calls.mostRecent().args[ 4 ];

            assets.forTheme( 'some-widget.html' )
               .then( html => {
                  expect( html ).toEqual( '<h1>hey</h1>' );
               } )
               .then( done, done.fail );

            expect( assets.forTheme ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and then to render the widget', () => {

            let container;

            beforeEach( () => {
               container = axMocks.widget.render();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'renders the widget template HTML through the adapter', () => {
               expect( document.querySelector( '.some-widget' ) ).toBe( container );
               expect( container.innerHTML ).toEqual( '<h1>hey</h1>' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and to tear it down again', () => {

               beforeEach( () => {
                  axMocks.tearDown();
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'clears the HTML', () => {
                  expect( document.querySelector( '.some-widget' ) ).toEqual( null );
               } );

            } );

         } );

      } );

   } );
} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createFakeDescriptor( name, type, features ) {
   return {
      name,
      integration: {
         type,
         technology: 'plain'
      },
      features
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createFakeArtifacts( descriptor, module ) {
   return {
      aliases: {
         themes: { 'default': 0, 'default.theme': 0 },
         widgets: { [ descriptor.name ]: 0 }
      },
      controls: [],
      themes: [
         {
            descriptor: { name: 'default.theme' },
            assets: {
               'css/theme.css': { url: '/spec/dummy.css' }
            }
         }
      ],
      widgets: [ {
         descriptor,
         module,
         assets: {
            'default.theme': {
               [ `${descriptor.name}.html` ]: { content: '<h1>hey</h1>' }
            }
         }
      } ]
   };
}
