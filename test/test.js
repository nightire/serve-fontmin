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
var Transform = require('stream').Transform;

var Storage = require('../lib/storage');
var fixtures = __dirname + '/fixtures';
var sourcePath = '/SentyBrush';
var textQuery = '?text=abc';
var basicUrl = sourcePath + '.css' + textQuery;
var dest = path.resolve(fixtures, 'dest');

describe('serveFontmin()', function () {

    describe('basic operations', function () {
        var server;

        before(function () {
            del.sync(dest);
            server = createServer();
        });

        it('should require root path', function () {
            assert.throws(serveFontmin.bind(), /root path required/);
        });

        it('should require root path to be string', function () {
            assert.throws(serveFontmin.bind(null, 123), /root path.*string/);
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

        it('should serve 404 when not found', function (done) {

            request(server)
                .get('/404')
                .expect(404, done);
        });

        it('should serve 404 when ext not support', function (done) {

            request(server)
                .get(sourcePath + '.woff2' + textQuery)
                .expect(404, done);
        });

        it('should serve 404 when src not found', function (done) {

            request(server)
                .get('/null.css')
                .expect(404, done);
        });

        it('should setHeader `Access-Control-Allow-Origin: *`', function (done) {

            request(server)
                .get(sourcePath + '.ttf' + textQuery)
                .expect('Access-Control-Allow-Origin', '*', done);
        });

    });

    describe('fontmin', function () {
        var server;

        var fakeStorage;

        before(function () {
            del.sync(dest);
            fakeStorage = new Storage(fixtures);

            // dest cb err
            fakeStorage.dest = function () {
                var transform = new Transform();
                transform._transform = function (file, encoding, cb) {
                    cb(new Error('fontmin err'), file);
                };
                return transform;
            };

            server = createServer(fixtures, {storage: fakeStorage});

        });

        it('should serve 500 when fontmin err', function (done) {

            request(server)
                .get(basicUrl)
                .expect(500, done);

        });

    });

    describe('optional Storage', function () {
        var server;

        var fakeStorage;

        before(function () {
            del.sync(dest);
            fakeStorage = new Storage(fixtures);
            fakeStorage._src = fakeStorage.src;
            server = createServer(fixtures, {storage: fakeStorage});

        });

        it('should serve with fakeStorage', function (done) {
            request(server)
                .get(basicUrl)
                .expect(200, done);
        });


        it('should require path when createReadStream', function (done) {

            assert.throws(function () {
                fakeStorage.createReadStream(null);
            });

            done();

        });

        // it('should require path when createWriteStream ', function (done) {

        //     assert.throws(function () {
        //         fakeStorage.createWriteStream(null);
        //     });

        //     done();

        // });

        // it('should create ReadStream and WriteStream ', function (done) {

        //     var writeStream = fakeStorage.createWriteStream('dest/SentyBrush.ttf');

        //     fakeStorage.createReadStream('SentyBrush.ttf')
        //         .pipe(writeStream);

        //     writeStream.on('finish', done);

        // });

        it('should fallback 404 when fakeStorage dest empty', function (done) {

            // return false when dest
            fakeStorage.has = function (key) {
                return !/dest/.test(key);
            };

            request(server)
                .get(basicUrl)
                .expect(404, done);
        });

        it('should fallback 404 when fakeStorage dest ext isn\'t font', function (done) {

            // return empty src
            fakeStorage.src = function () {
                return fakeStorage._src('../*.js');
            };

            request(server)
                .get(basicUrl)
                .expect(404, done);
        });

        it('should fallback 404 when fakeStorage src empty', function (done) {

            // return empty src
            fakeStorage.src = function () {
                return fakeStorage._src('*.css');
            };

            request(server)
                .get(basicUrl)
                .expect(404, done);
        });

    });


    describe('response optimization', function () {
        var server;

        before(function () {
            del.sync(dest);
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
            del.sync(dest);
            server = createServer(fixtures, {base64: true});
        });

        it('should inject data:application/x-font-ttf', function (done) {
            request(server)
                .get(basicUrl)
                .expect(/data:application\/x-font-ttf/)
                .expect(200, done);
        });


    });

    describe('optional font-family', function () {
        var server;

        before(function () {
            del.sync(dest);
            server = createServer();
        });

        it('should have target font-family in css ', function (done) {
            request(server)
                .get(basicUrl + '&name=target-font-family')
                .expect(/target-font-family/)
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
