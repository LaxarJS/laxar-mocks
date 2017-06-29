/**
 * Copyright 2016-2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/* eslint-env node */

/**
 * Webpack loader for LaxarJS widget spec tests.
 *
 * Automatically loads the following dependencies, which you would otherwise have to pass as options to
 * `setupForWidget`:
 *
 *  - `descriptor`: the `widget.json` descriptor of a widget, *including* the JSON features schema (if any)
 *  - `artifacts`: artifacts for the widget and its dependencies (obtained through the laxar-loader)
 *  - `adapter`: the necessary adapter module, if the technology is not 'plain'
 *
 * This information is stored using the `fixtures` property of the laxar-mocks module itself.
 *
 * To use, simply configure webpack to use the `laxar-mocks/spec-loader` for files matching
 * /spec/.*\.spec\.js$/` and make sure to name your widget specs accordingly.
 *
 * @name spec-loader
 */

const path = require( 'path' );
const process = require( 'process' );

module.exports = function( content ) {
   if( this.cacheable ) {
      this.cacheable();
   }

   const widgetDirectory = this.resource.replace( /\/spec\/[^/]+$/, '' );
   const ref = `module:./${path.relative( process.cwd(), widgetDirectory )}`;
   const descriptor = require( `${widgetDirectory}/widget.json` );
   const technology = descriptor.integration.technology;
   const dependencies = {
      adapter: technology === 'plain' ? null : `laxar-${technology}-adapter`,
      artifacts: `laxar-loader/artifacts?widget=${ref}`,
      descriptor: '../widget.json'
   };

   return [
      `
      require( 'laxar-mocks' ).init( {
         adapter: ${dependency('adapter')},
         artifacts: ${dependency('artifacts')},
         descriptor: ${dependency('descriptor')}
      } );
      `.replace( /\n/g, ' ' ),
      content
   ].join( ';' );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function dependency( name ) {
      const path = dependencies[ name ];
      return path ? `require( '${path}' )` : 'undefined';
   }
};
