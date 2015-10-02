/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'require',
   'laxar',
   './helpers',
   './mini_http'
], function( require, ax, helpers, http ) {
   'use strict';

   var path = ax._tooling.path;

   function createSetupForWidget( specContext, widgetInfo, widgetPrivateApi, widgetDescriptor ) {
      return loadWidget( specContext, widgetDescriptor )
         .then( setupWidgetInfo.bind( null, specContext, widgetInfo, widgetPrivateApi, widgetDescriptor ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function loadWidget( specContext, widgetDescriptor ) {
      var widgetDirectory = path.join( specContext.absSpecLocation, '..' );
      var requireWidgetDirectory = path.relative( require.toUrl( '.' ), widgetDirectory );
      var filename = widgetDescriptor.name.replace( /(.)([A-Z])/g, '$1-$2' ).toLowerCase();

      return getControlReferences( widgetDescriptor )
         .then( function( controls ) {
            var deps = [ path.join( requireWidgetDirectory, filename ) ].concat( controls );
            return helpers.require( deps );
         } )
         .then( function( modules ) {
            return registerModules( modules[ 0 ], modules.slice( 1 ), widgetDescriptor.integration.technology );
         } )
         .then( function() {
            return {
               id: 'testWidget',
               widget: path.relative( require.toUrl( 'laxar-path-widgets' ), widgetDirectory )
            };
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function setupWidgetInfo( specContext, widgetInfo, widgetPrivateApi, widgetDescriptor, basicWidgetConfiguration ) {
      ax._tooling.fileResourceProvider.init( helpers.legacyQ(), http );

      var cssLoader = { load: function() {} };
      var applicationRootPath = ax._tooling.path.normalize( require.toUrl( 'laxar-path-root' ) );
      var fileResourceProvider = ax._tooling.fileResourceProvider.create( applicationRootPath );
      if( specContext.options.knownMissingResources.length > 0 ) {
         decorateFileResourceProvider( fileResourceProvider, specContext.options.knownMissingResources );
      }
      var themeManager = ax._tooling.themeManager.create( fileResourceProvider, helpers.legacyQ(), 'default' );

      widgetPrivateApi.featureConfiguration = {};
      widgetPrivateApi.configure = function( key, val ) {
         if( arguments.length === 2 ) {
            ax.object.setPath( widgetPrivateApi.featureConfiguration, key, ax.object.deepClone( val ) );
         }
         else {
            widgetPrivateApi.featureConfiguration = ax.object.deepClone( key );
         }
      };
      widgetPrivateApi.load = function() {
         var configuration = ax.object.options( basicWidgetConfiguration, {
            features: widgetPrivateApi.featureConfiguration || {}
         } );

         return ax._tooling.widgetLoader
            .create( helpers.legacyQ(), {
               axFileResourceProvider: fileResourceProvider,
               axThemeManager: themeManager,
               axCssLoader: cssLoader,
               axGlobalEventBus: specContext.eventBus
            } )
            .load( configuration, {
               onBeforeControllerCreation: function( environment, injections ) {
                  [ 'subscribe', 'publish', 'publishAndGatherReplies' ].forEach( function( method ) {
                     spyOn( environment.context.eventBus, method ).and.callThrough();
                  } );
                  ax.object.forEach( injections, function( value, key ) {
                     widgetInfo[ key ] = value;
                  } );
               }
            } )
            .then( function( loadingInfo ) {
               return loadingInfo.templatePromise
                  .then( function( template ) {
                     widgetPrivateApi.destroy = loadingInfo.destroy;
                     widgetPrivateApi.renderTo = function( container ) {
                        loadingInfo.adapter.domAttachTo( container, template );

                        var adapterFactory = ax._tooling.widgetAdapters
                           .getFor( widgetDescriptor.integration.technology );
                        if( adapterFactory.applyViewChanges ) {
                           adapterFactory.applyViewChanges();
                        }
                     };
                  } );
            } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function registerModules( widgetModule, controlModules, widgetTechnology ) {
      var adapter = ax._tooling.widgetAdapters.getFor( widgetTechnology );
      if( !adapter ) {
         ax.log.error( 'Unknown widget technology: [0]', widgetTechnology );
         return Promise.reject( new Error( 'Unknown widget technology: ' + widgetTechnology ) );
      }

      if( widgetTechnology === 'angular' ) {
         return helpers.require( [ 'angular-mocks' ] )
            .then( function( modules ) {
               var ngMocks = modules[ 0 ];
               var adapterModule = adapter.bootstrap( [ widgetModule ] );
               ngMocks.module( ax._tooling.runtimeDependenciesModule.name );
               ngMocks.module( adapterModule.name );
               controlModules.forEach( function( controlModule ) {
                  if( controlModule.name ) {
                     ngMocks.module( controlModule.name );
                  }
               } );
               ngMocks.inject();
               return adapter;
            } );
      }

      adapter.bootstrap( [ widgetModule ] );
      return Promise.resolve( adapter );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function getControlReferences( widgetJson ) {
      var controlRefs = widgetJson.controls || [];

      return Promise.all( controlRefs.map( function( controlRef ) {
         // By appending .json afterwards, trick RequireJS into generating the correct descriptor path when
         // loading from a 'package'.
         return http.getJson( require.toUrl( controlRef + '/control' ) + '.json' )
            .then( function( controlJson ) {
               return controlRef + '/' + controlJson.name;
            } );
      } ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function decorateFileResourceProvider( fileResourceProvider, knownMissingResources ) {
      var origIsAvailable = fileResourceProvider.isAvailable.bind( fileResourceProvider );
      var origProvide = fileResourceProvider.provide.bind( fileResourceProvider );

      fileResourceProvider.isAvailable = function( url ) {
         return notAvailable( url ) ? Promise.resolve( false ) : origIsAvailable( url );
      };

      fileResourceProvider.provide  = function( url ) {
         return notAvailable( url ) ? Promise.reject() : origProvide( url );
      };

      function notAvailable( url ) {
         return knownMissingResources.some( function( missingResource ) {
            if( missingResource instanceof RegExp ) {
               return missingResource.test( url );
            }
            return url.indexOf( '' + missingResource ) !== -1;
         } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      createSetupForWidget: createSetupForWidget
   };

} );