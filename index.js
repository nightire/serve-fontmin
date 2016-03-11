/**
 * @file serve-fontmin
 * @author junmer
 */

// base
var path = require('path');
var fs = require('fs');
var resolve = require('path').resolve;
var send = require('send');
var streamRename = require('stream-rename');
var Fontmin = require('fontmin');

// lib
var fontUrl = require('./lib/font-url');
var Storage = require('./lib/storage');

/**
 * Module exports.
 * @public
 */

module.exports = serveFontmin;

/**
 * outputStream
 *
 * @param  {stream}   stream stream
 * @param  {res}   res response
 * @param  {Function} next next
 */
function outputStream(stream, res, next) {

    stream.on('directory', function forbidden() {
        res.statusCode = 403;
    });

    // forward errors
    stream.on('error', function error(err) {

        if (!(err.statusCode < 500)) {
            next(err);
            return;
        }

        next();
    });

    // pipe
    stream.pipe(res);
}

/**
 * serveFontmin
 *
 * @param {string} root root
 * @param {Object} options options
 * @return {Function} serveFontmin handler
 * @public
 */
function serveFontmin(root, options) {

    if (!root) {
        throw new TypeError('root path required');
    }

    if (typeof root !== 'string') {
        throw new TypeError('root path must be a string');
    }

    // copy options object
    var opts = Object.create(options || null);

    opts.root = resolve(root);

    opts.dest = opts.dest || 'dest';

    // for css
    opts.fontPath = ['.', opts.dest, ''].join('/');

    // Dest
    var dest = resolve(opts.root, opts.dest);

    // storage
    var storage = opts.storage || new Storage(opts.root);

    /**
     * serveFontmin
     *
     * @param  {req}   req request
     * @param  {res}   res response
     * @param  {Function} next next
     */
    return function (req, res, next) {

        /**
         * outputFile
         *
         * @param  {string} path
         */
        function outputFile (path) {
            var stream = send(req, path, opts);
            outputStream(stream, res, next);
        }

        /**
         * font
         *
         * @type {Object}
         */
        var font = fontUrl.parse(req);

        // no next
        if (!font.text) {
            res.statusCode = 404;
            next();
            return;
        }

        // not support
        if (!font.support) {
            res.statusCode = 404;
            next();
            return;
        }

        // srcPath
        var srcPath = resolve(opts.root, font.srcPath);

        // 404
        if (!font.srcPath || !storage.has(srcPath)) {
            res.statusCode = 404;
            next();
            return;
        }

        // destPath
        var destPath = resolve(dest, font.hash, font.ext);

        if (storage.has(destPath)) {
            outputFile(destPath);
        }
        else {

            // fontmin init
            var fontmin = new Fontmin()
                .src(srcPath)
                .use(Fontmin.glyph({
                    text: font.text
                }))
                .use(streamRename({
                    basename: font.hash
                }))
                .use(Fontmin.ttf2eot(opts))
                .use(Fontmin.ttf2woff(opts))
                .use(Fontmin.ttf2svg(opts))
                .use(Fontmin.css(opts))
                .dest(opts.dest);

            // run
            fontmin.run(function (err, files) {

                // fontmin err
                if (err) {
                    res.statusCode = 502;
                    next(err);
                    return;
                }

                // empty src
                if (files.length === 0) {
                    res.statusCode = 404;
                    next();
                    return;
                }

                // output dest
                var finded = files.some(function (file) {

                    if (path.extname(file.path) === font.ext) {
                        outputFile(destPath);
                        return true;
                    }

                });

                // empty dest
                if (finded.length === 0) {
                    res.statusCode = 404;
                    next();
                    return;
                }

            });

        }


    };

}
