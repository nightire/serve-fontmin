/**
 * @file test
 * @author junmer
 */

/* eslint-env node */
/* global before, after, beforeEach */

var assert = require('assert');
var http = require('http');
var path = require('path');
var del = require('del');
var request = require('supertest');
var serveFontmin = require('..');

var fixtures = __dirname + '/fixtures';
var sourcePath = '/SentyBrush';
var textQuery = '?text=abc';
var basicUrl = sourcePath + '.css' + textQuery;
var dest = path.resolve(fixtures, 'dest');

describe('serveFontmin()', function () {

    beforeEach(function () {
        del.sync(dest);
    });

    describe('basic operations', function () {
        var server;

        before(function () {
            server = createServer();
        });

        it('should serve css files', function (done) {

            request(server)
                .get(basicUrl)
                .expect(/@font-face/)
                .expect(/font-family/)
                .expect(/ttf/)
                .expect(/eot/)
                .expect(/woff/)
                .expect(/svg/)
                .expect(200, done);
        });

        it('should serve files in css url()', function (done) {

            function reqUrlsInCss(urls) {

                var task = urls.length;
                var last = task;

                function next(err, res) {
                    last--;

                    assert.ifError(err);

                    if (!last) {
                        done();
                    }
                }

                while (task--) {
                    request(server)
                        .get(urls[task])
                        .expect(200, next);
                }

            }

            request(server)
                .get(basicUrl)
                .expect(200, getUrlsInCss(reqUrlsInCss));

        });

        it('should serve ttf files', function (done) {
            request(server)
                .get(sourcePath + '.ttf' + textQuery)
                .expect(200, done);
        });

        it('should serve woff files', function (done) {
            request(server)
                .get(sourcePath + '.woff' + textQuery)
                .expect(200, done);
        });

        it('should serve svg files', function (done) {
            request(server)
                .get(sourcePath + '.svg' + textQuery)
                .expect(200, done);
        });

    });

    describe('optional font-family', function () {
        var server;

        before(function () {
            server = createServer();
        });

        it('should have target font-family in css ', function (done) {
            request(server)
                .get(basicUrl + '&name=target-font-family')
                .expect(/target-font-family/)
                .expect(200, done);
        });

    });

    describe('response optimization', function () {
        var server;

        before(function () {
            server = createServer(fixtures, {oppressor: true});
        });

        it('should accept-encoding compress', function (done) {
            request(server)
                .get(basicUrl)
                .expect('content-encoding', 'gzip')
                .expect('transfer-encoding', 'chunked')
                .expect(200, done);

        });


    });

    describe('base64 optimization', function () {
        var server;

        before(function () {
            server = createServer(fixtures, {base64: true});
        });

        it('should inject data:application/x-font-ttf', function (done) {
            request(server)
                .get(basicUrl)
                .expect(/data:application\/x-font-ttf/)
                .expect(200, done);
        });


    });

    after(function () {
        del.sync(dest);
    });

});

function getUrlsInCss(cb) {

    return function (err, res) {
        var urls = [];
        res.text.replace(
            /url\s*\(\s*(['"]?)([^\)]+)\1\s*\)/g,
            function (match, quote, url) {
                urls.push(
                    url
                        .replace(/\??\#\w+$/, '') // igonre ? and #abc
                        .replace(/^\./, '') // ignore .
                );
            }
        );
        cb(urls);
    };

}

function createServer(dir, opts, fn) {
    dir = dir || fixtures;

    var serve = serveFontmin(dir, opts);

    return http.createServer(function (req, res) {
        fn && fn(req, res);
        serve(req, res, function (err) {
            res.statusCode = err ? (err.status || 500) : 404;
            res.end(err ? err.stack : 'sorry!');
        });
    });
}
