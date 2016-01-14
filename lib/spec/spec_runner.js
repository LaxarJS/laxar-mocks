/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
(function( global ) {
   'use strict';
   global.laxarSpec = {
      title: 'LaxarJS Mocks Specification',
      tests: [
         'helpers.spec',
         'mini_http.spec',
         'laxar-mocks.spec',
         'widget_spec_initializer.spec'
      ],
      requireConfig: {},
      testRunner: 'laxar-mocks',
      jasmineMajorVersion: 2
   };
})( this );
