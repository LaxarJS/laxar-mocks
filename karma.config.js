/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/* eslint-env node */
const pkg = require( './package.json' );
const laxarInfrastructure = require( 'laxar-infrastructure' );

module.exports = function( config ) {
   config.set( karmaConfig() );
};

function karmaConfig() {
   const webpackBaseConfig = require( './webpack.config' )[ 0 ];
   return laxarInfrastructure.karma( [ `spec/${pkg.name}.spec.js` ], {
      context: __dirname,
      resolve: webpackBaseConfig.resolve,
      module: webpackBaseConfig.module
   } );
}
