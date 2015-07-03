var require = {
   baseUrl: './bower_components/',
   paths: {
      requirejs: 'requirejs/require',
      text: 'requirejs-plugins/lib/text',
      json: 'requirejs-plugins/src/json',

      'laxar': 'laxar/dist/laxar',

      'angular-route': 'angular-route/angular-route',
      'angular-sanitize': 'angular-sanitize/angular-sanitize',
      'angular-mocks': 'angular-mocks/angular-mocks',
      angular: 'angular/angular',

      jjv: 'jjv/lib/jjv',
      jjve: 'jjve/jjve',

      // LaxarJS testing
      jasmine: 'jasmine/lib/jasmine-core/jasmine'
   },
   packages: [
      {
         name: 'laxar-testing',
         location: '.',
         main: 'laxar-testing'
      }
   ],
   shim: {
      angular: {
         exports: 'angular'
      },
      'angular-mocks': {
         init: function ( angular ) {
            'use strict';
            return angular.mock;
         }
      },
      'angular-route': {
         init: function ( angular ) {
            'use strict';
            return angular.route;
         }
      },
      'angular-sanitize': {
         init: function ( angular ) {
            'use strict';
            return angular;
         }
      }
   }
};
