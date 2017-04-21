/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/* eslint-env node */

const path = require( 'path' );
const pkg = require( './package.json' );

const webpack = require( 'laxar-infrastructure' ).webpack( {
   context: __dirname,
   resolve: {
      // 'webpack' is included to get rid of ajv warnings
      mainFields: [ 'webpack', 'browser', 'main', 'index' ]
   },
   module: {
      rules: [
         {
            test: /\.js$/,
            include: [
               path.resolve( __dirname, pkg.main ),
               path.resolve( __dirname, 'lib/' ),
               path.resolve( __dirname, 'spec/' ),
               path.resolve( __dirname, 'node_modules/laxar/' )
            ],
            loader: 'babel-loader'
         }
      ]
   }
} );

module.exports = [
   webpack.library(),
   webpack.browserSpec( [ `./spec/${pkg.name}.spec.js` ] )
];
