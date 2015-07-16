/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
(function( global ) {
   'use strict';
   global.laxarSpec = {
      title: 'LaxarJS Testing Specification',
      tests: [
         'helpers.spec',
         'mini_http.spec',
         'laxar-testing.spec',
         'widget_spec_initializer.spec'
      ],
      requireConfig: {},
      testRunner: 'laxar-testing',
      jasmineMajorVersion: 2
   };
})( this );
