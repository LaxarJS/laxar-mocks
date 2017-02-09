/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/* eslint-env node */

/**
 * Webpack loader for LaxarJS widget spec tests.
 *
 * Automatically loads the following dependencies, which you would otherwise have to pass as options to
 * `createSetupForWidget`:
 *
 *  - `artifacts`: artifacts for the widget and its dependencies (obtained through the laxar-loader)
 *  - `adapter`: the necessary adapter module, if the technology is not 'plain'
 *
 * The listings are stored at `window.laxarMocksFixtures`, where LaxarJS mocks will pick them up.
 *
 * To use, simply configure webpack to use the `laxar-mocks/spec-loader` for files matching /.spec.js$/`,
 * and make sure to name your widget specs accordingly.
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
      ( function( fixtures, adapter, artifacts, descriptor ) {
         fixtures.adapter = adapter;
         fixtures.artifacts = artifacts;
         fixtures.descriptor = descriptor;
      } )(
         require( 'laxar-mocks' ).fixtures,
         ${dependency('adapter')},
         ${dependency('artifacts')},
         // cannot simply read descriptor from artifacts because the features schema may have been stripped:
         ${dependency('descriptor')}
      );
      `,
      content
   ].join( ';' );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function dependency( name ) {
      const path = dependencies[ name ];
      return path ? `require( '${path}' )` : 'undefined';
   }
};
