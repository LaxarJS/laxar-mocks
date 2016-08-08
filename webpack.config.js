/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/**
 * Webpack configuration for the standalone laxar dist bundle.
 * A source map is generated, but the bundle is not minified.
 */

/* eslint-env node */

const path = require( 'path' );
const webpack = require( 'webpack' );

const baseConfig = require( './webpack.base.config' );

module.exports = [
   distConfig( './laxar-mocks.js', 'laxar-mocks.js', { externals: { laxar: 'laxar' } } )
];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function distConfig( entry, output, optionalOptions ) {
   const options = Object.assign( {
      minify: false,
      externals: {
         'fast-json-patch': 'fast-json-patch',
         'laxar': 'laxar',
         'page': 'page',
         'jjv': 'jjv',
         'jjve': 'jjve'
      }
   }, optionalOptions || {} );

   const config = Object.assign( {}, baseConfig );

   config.entry = entry;

   config.output = {
      path: path.resolve( __dirname ),
      filename: `dist/${output}`,
      library: 'laxar',
      libraryTarget: 'umd',
      umdNamedDefine: true
   };

   config.externals = options.externals;

   config.plugins = [
      new webpack.SourceMapDevToolPlugin( {
         filename: `dist/${output}.map`
      } )
   ];

   if( options.minify ) {
      config.plugins.push(
         new webpack.optimize.UglifyJsPlugin( {
            compress: { warnings: false },
            sourceMap: true
         } )
      );
   }

   return config;
}
