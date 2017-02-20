import * as axMocks from '../laxar-mocks';
import { object } from 'laxar';

describe( 'A laxar-mocks test runner', () => {

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'offers a LaxarJS v1 compatible createSetupForWidget function', () => {
      expect( axMocks.createSetupForWidget ).toEqual( jasmine.any( Function ) );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'asked to create a setup for an activity using the deprecated createSetupForWidget', () => {

      let create;

      beforeEach( done => {
         create = jasmine.createSpy( 'widgetModule.create' );
         const descriptor = createFakeDescriptor( 'some-activity', 'activity', null );
         const artifacts = createFakeArtifacts( descriptor, { create } );
         const configuration = { baseHref: '/' };
         spyOn( window.console, 'warn' );
         axMocks.createSetupForWidget( descriptor, { artifacts, configuration } )( done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'logs a deprecation warning to the browser console', () => {
         expect( window.console.warn ).toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and then to load the controller', () => {

         beforeEach( axMocks.widget.load );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'instantiates the widget controller', () => {
            expect( create ).toHaveBeenCalled();
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'offers to create a test setup function', () => {
      expect( axMocks.setupForWidget ).toEqual( jasmine.any( Function ) );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'asked to create a setup for an activity', () => {

      let descriptor;
      let artifacts;
      let configuration;
      let create;

      beforeEach( done => {
         descriptor = createFakeDescriptor( 'some-activity', 'activity', null );
         create = jasmine.createSpy( 'widgetModule.create' );
         artifacts = createFakeArtifacts( descriptor, { create } );
         configuration = { baseHref: '/' };
         axMocks.setupForWidget( { descriptor, artifacts, configuration } )( done );
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

   describe( 'asked to create a setup using fixtures, for a widget with a lot of injections', () => {

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
               i18n: {
                  type: 'object',
                  properties: {
                     locale: {
                        type: 'string',
                        format: 'topic',
                        default: 'default'
                     }
                  }
               }
            }
         } );
         create = jasmine.createSpy( 'widgetModule.create' ).and.callFake( () => ({
            onDomAvailable: () => {}
         }) );
         artifacts = createFakeArtifacts( descriptor, {
            injections: [ 'axFeatures', 'axStorage', 'axLog', 'axConfiguration', 'axAssets', 'axVisibility' ],
            create
         } );
         configuration = { baseHref: '/' };

         axMocks.fixtures.descriptor = descriptor;
         axMocks.fixtures.artifacts = artifacts;
         axMocks.fixtures.configuration = configuration;
         axMocks.setupForWidget()( done );
      } );

      afterEach( () => {
         delete axMocks.fixtures.descriptor;
         delete axMocks.fixtures.artifacts;
         delete axMocks.fixtures.configuration;
         delete axMocks.fixtures.adapter;
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and then to configure', () => {

         beforeEach( () => {
            axMocks.widget.configure( { someFeature: 'someValue' } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and to load the controller', () => {

            beforeEach( axMocks.widget.load );

            it( 'instantiates the widget controller with the requested injections and config', () => {
               expect( create ).toHaveBeenCalled();
               const [
                  features, storage, log, configuration, assets, visibility
               ] = create.calls.mostRecent().args;
               expect( features ).toEqual( { someFeature: 'someValue', i18n: { locale: 'default' } } );
               expect( storage.local.setItem ).toEqual( jasmine.any( Function ) );
               expect( log.info ).toEqual( jasmine.any( Function ) );
               expect( configuration.get ).toEqual( jasmine.any( Function ) );
               expect( assets ).toEqual( jasmine.any( Function ) );
               expect( visibility ).toEqual( jasmine.any( Object ) );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'provides a mock-storage injection without side-effects', () => {
               expect( create ).toHaveBeenCalled();
               const storage = create.calls.mostRecent().args[ 1 ];
               storage.mockBackends.session.test = '"mockValue"';
               expect( storage.session.getItem( 'test' ) ).toEqual( 'mockValue' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'provides a mock-log injection without side-effects', () => {
               const log = create.calls.mostRecent().args[ 2 ];
               log.error( 'test error' );
               expect( log.error ).toHaveBeenCalled();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'provides a mock-configuration injection with the values given to setup', () => {
               const configuration = create.calls.mostRecent().args[ 3 ];
               expect( configuration.get( 'baseHref' ) ).toEqual( '/' );
               expect( configuration.get ).toHaveBeenCalled();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'provides a mock-assets injection with the values given to setup', done => {
               const assets = create.calls.mostRecent().args[ 4 ];

               assets.forTheme( 'some-widget.html' )
                  .then( html => {
                     expect( html ).toEqual( '<h1>hey</h1>' );
                  } )
                  .then( done, done.fail );

               expect( assets.forTheme ).toHaveBeenCalled();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'provides a mock-visibility injection', () => {
               const visibility = create.calls.mostRecent().args[ 5 ];
               expect( visibility.mockShow ).toEqual( jasmine.any( Function ) );
               expect( visibility.mockHide ).toEqual( jasmine.any( Function ) );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and then to render the widget', () => {

               let container;

               beforeEach( () => {
                  container = axMocks.widget.render();
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'renders the widget template HTML through the adapter', () => {
                  expect( document.querySelector( '.some-widget' ) ).toBe( container );
                  expect( container.innerHTML ).toEqual( '<h1>hey</h1>' );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               describe( 'and to tear it down again', () => {

                  beforeEach( axMocks.tearDown );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'publishes the endLifecycleRequest event', () => {
                     expect( axMocks.eventBus.publishAndGatherReplies ).toHaveBeenCalledWith(
                        'endLifecycleRequest.default',
                        { lifecycleId: 'default' }
                     );
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'clears the HTML', () => {
                     expect( document.querySelector( '.some-widget' ) ).toEqual( null );
                  } );

               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               describe( 'and to tear it down again, with endLifecycleRequest disabled', () => {

                  beforeEach( done => {
                     axMocks.tearDown( done, { publishEndLifecycleRequest: false } );
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'publishes the endLifecycleRequest event', () => {
                     expect( axMocks.eventBus.publishAndGatherReplies ).not.toHaveBeenCalledWith(
                        'endLifecycleRequest.default',
                        { lifecycleId: 'default' },
                        jasmine.any( Object )
                     );
                  } );

               } );

            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and then to re-configure an individual path, and to load the controller', () => {

            beforeEach( done => {
               axMocks.widget.configure( 'i18n.locale', 'vendor' );
               axMocks.widget.load( done );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'instantiates the widget controller incorporating the configuration change', () => {
               expect( create ).toHaveBeenCalled();
               const [ features ] = create.calls.mostRecent().args;
               expect( features ).toEqual( { someFeature: 'someValue', i18n: { locale: 'vendor' } } );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and then to reconfigre an individual path with a format-violating string', () => {

            beforeEach( () => {
               axMocks.widget.configure( 'i18n.locale', ' dasd  asdas as' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'applies laxar-specific validation, for formats', done => {
               try {
                  axMocks.widget.load( done.fail, done );
               }
               catch( e ) {
                  expect( e ).toMatch( 'Validation' );
                  done();
               }
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and then to re-configure an individual path, and to load the controller', () => {

            beforeEach( done => {
               axMocks.widget.configure( { i18n: { locale: 'customer' } } );
               axMocks.widget.load( done );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'instantiates the widget controller using the new configuration', () => {
               expect( create ).toHaveBeenCalled();
               const [ features ] = create.calls.mostRecent().args;
               expect( features ).toEqual( { i18n: { locale: 'customer' } } );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and then to register service listeners, and to load the controller', () => {

            let services1;
            let services2;

            beforeEach( done => {
               axMocks.widget.whenServicesAvailable( services => {
                  services1 = object.deepClone( services );
                  services.axId = () => 'MY ID';
               } );
               axMocks.widget.whenServicesAvailable( services => {
                  services2 = object.deepClone( services );
               } );
               axMocks.widget.load( done );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'runs the registered callbacks providing the (mock) injections', () => {
               expect( services1 ).toBeDefined();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'allows to override individual services', () => {
               expect( services2 ).toBeDefined();
               expect( services2.axId( 'x' ) ).toEqual( 'MY ID' );
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
