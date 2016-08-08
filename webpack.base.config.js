/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/* eslint-env node */

module.exports = {
   entry: {
      'laxar-mocks': './laxar-mocks.js'
   },
   module: {
      loaders: [
         {
            test: /\.js$/,
            exclude: /(node_modules)\/(?!laxar.*)/,
            loader: 'babel-loader'
         }
      ]
   }
};
