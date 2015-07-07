var require = {
   baseUrl: './',
   paths: {
      requirejs: 'bower_components/requirejs/require',
      text: 'bower_components/requirejs-plugins/lib/text',
      json: 'bower_components/requirejs-plugins/src/json',

      'laxar': 'bower_components/laxar/dist/laxar',

      'angular-route': 'bower_components/angular-route/angular-route',
      'angular-sanitize': 'bower_components/angular-sanitize/angular-sanitize',
      'angular-mocks': 'bower_components/angular-mocks/angular-mocks',
      angular: 'bower_components/angular/angular',

      jjv: 'bower_components/jjv/lib/jjv',
      jjve: 'bower_components/jjve/jjve',

      // LaxarJS Testing
      jasmine: 'bower_components/jasmine/lib/jasmine-core/jasmine',
      'promise-polyfill': 'bower_components/promise-polyfill/Promise'
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
         deps: [ 'angular' ],
         init: function ( angular ) {
            'use strict';
            return angular.mock;
         }
      },
      'angular-route': {
         deps: [ 'angular' ],
         init: function ( angular ) {
            'use strict';
            return angular.route;
         }
      },
      'angular-sanitize': {
         deps: [ 'angular' ],
         init: function ( angular ) {
            'use strict';
            return angular;
         }
      }
   }
};
