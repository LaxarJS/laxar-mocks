/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../mini_http',
   'jasmine-ajax'
], function( miniHttp ) {
   'use strict';

   describe( 'miniHttp', function() {

      it( 'defines all relevant methods used by laxar core', function() {
         expect( typeof miniHttp.get ).toEqual( 'function' );
         expect( typeof miniHttp.head ).toEqual( 'function' );
         expect( typeof miniHttp.getJson ).toEqual( 'function' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( '.getJson', function() {

         var promise;

         beforeEach( function() {
            jasmine.Ajax.install();

            promise = miniHttp.getJson( 'http://url.json', {
               'Custom-Header': 'whatever'
            } );

            jasmine.Ajax.requests.mostRecent().respondWith( {
               status: 200,
               contentType: 'application/json',
               responseText: '{"key":"value"}'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         afterEach(function() {
            jasmine.Ajax.uninstall();
         });

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'makes an ajax request using the correct parameters', function() {
            var request = jasmine.Ajax.requests.mostRecent();

            expect( request.url ).toEqual( 'http://url.json' );
            expect( request.method ).toEqual( 'GET' );
            expect( request.requestHeaders ).toEqual( jasmine.objectContaining( {
               Accept: 'application/json',
               'Cache-Control': 'no-cache',
               'Custom-Header': 'whatever'
            } ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'parses the response as JSON', function( done ) {
            promise.then( function( data ) {
               expect( data ).toEqual( { key: 'value' } );
               done();
            } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( '.get', function() {

         var promise;

         beforeEach( function() {
            jasmine.Ajax.install();

            // attention: due to caching within mini http, we have to use a "fresh" url for this test
            promise = miniHttp.get( 'http://geturl.json', {
               'Custom-Header': 'whatever'
            } );

            jasmine.Ajax.requests.mostRecent().respondWith( {
               status: 200,
               contentType: 'application/json',
               responseText: '{"key":"value"}'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         afterEach(function() {
            jasmine.Ajax.uninstall();
         });

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'makes an ajax request using the correct parameters', function() {
            var request = jasmine.Ajax.requests.mostRecent();

            expect( request.url ).toEqual( 'http://geturl.json' );
            expect( request.method ).toEqual( 'GET' );
            expect( request.requestHeaders ).toEqual( jasmine.objectContaining( {
               'Cache-Control': 'no-cache',
               'Custom-Header': 'whatever'
            } ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not parse the response but returns a complete response object', function( done ) {
            promise.then( function( response ) {
               expect( response ).toEqual( jasmine.objectContaining( {
                  status: 200,
                  data: '{"key":"value"}'
               } ) );
               done();
            } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( '.head', function() {

         var promise;

         beforeEach( function() {
            jasmine.Ajax.install();

            // attention: due to caching within mini http, we have to use a "fresh" url for this test
            promise = miniHttp.head( 'http://headurl.json', {
               'Custom-Header': 'whatever'
            } );

            jasmine.Ajax.requests.mostRecent().respondWith( {
               status: 200,
               contentType: 'application/json',
               responseText: '{"key":"value"}'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         afterEach(function() {
            jasmine.Ajax.uninstall();
         });

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'makes a simple GET ajax request using the correct parameters', function() {
            var request = jasmine.Ajax.requests.mostRecent();

            expect( request.url ).toEqual( 'http://headurl.json' );
            expect( request.method ).toEqual( 'GET' );
            expect( request.requestHeaders ).toEqual( jasmine.objectContaining( {
               'Cache-Control': 'no-cache',
               'Custom-Header': 'whatever'
            } ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not parse the response but returns a complete response object', function( done ) {
            promise.then( function( response ) {
               expect( response ).toEqual( jasmine.objectContaining( {
                  status: 200,
                  data: '{"key":"value"}'
               } ) );
               done();
            } );
         } );

      } );

   } );


} );
