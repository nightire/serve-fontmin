/**
 * @file serve-fontmin
 * @author junmer
 */

// base
var path = require('path');
var resolve = require('path').resolve;
var streamRename = require('stream-rename');
var concat = require('concat-stream');
var Fontmin = require('fontmin');
var extend = require('xtend');
var Transform = require('stream').Transform;
var oppressor = require('oppressor');

// lib
var fontUrl = require('./lib/font-url');
var Storage = require('./lib/storage');

// noop
function noop() {

    var transform = new Transform();

    transform._transform = function (chunk, encoding, done) {
        done(null, chunk);
    };

    return transform;
}

/**
 * Module exports.
 * @public
 */

module.exports = serveFontmin;


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
    var opts = extend({}, options);

    opts.root = resolve(root);

    opts.dest = opts.dest || 'dest';

    // for css
    opts.fontPath = ['.', opts.dest, ''].join('/');

    // storage
    var storage = opts.storage || new Storage(opts.root);

    /**
     * fontmin
     *
     * @param  {Object}   font     font
     * @param  {Object}   opts     opts
     * @param  {Function} callback callback
     */
    function fontmin(font, opts, callback) {

        var fmOpts = extend({}, opts);

        // font family
        fmOpts.fontFamily = font.name || font.basename;

        var stream = storage.src(font.srcPath)
            .pipe(Fontmin.glyph({
                text: font.text
            })())
            .pipe(streamRename({
                basename: font.hash
            }))
            .pipe(Fontmin.ttf2eot(fmOpts)())
            .pipe(Fontmin.ttf2woff(fmOpts)())
            .pipe(Fontmin.ttf2svg(fmOpts)())
            .pipe(Fontmin.css(fmOpts)())
            .pipe(storage.dest(opts.dest));

        stream.on('error', callback);
        stream.pipe(concat(callback.bind(null, null)));

    }



    /**
     * serveFontmin
     *
     * @param  {req}   req request
     * @param  {res}   res response
     * @param  {Function} next next
     */
    return function (req, res, next) {

        /**
         * send
         *
         * @param  {string} target path
         */
        function send(target) {

            var stream = storage
                .createReadStream(target);

            // empty stream
            if (!stream) {
                res.statusCode = 404;
                next();
                return;
            }

            stream.pipe(opts.oppressor ? oppressor(req) : noop()).pipe(res);
        }

        /**
         * sendDest
         *
         * @param  {Array}   files files
         * @param  {Object}   font font
         */
        function sendDest(files, font) {

            // empty src
            if (files.length === 0) {
                res.statusCode = 404;
                next();
                return;
            }

            // output dest
            var sended = files.some(function (file) {

                if (path.extname(file.path) === font.ext) {
                    send(file.path);
                    return true;
                }

            });

            // empty dest
            if (!sended) {
                res.statusCode = 404;
                next();
            }

        }

        /**
         * font info
         *
         * @type {Object}
         */
        var font = fontUrl.parse(req);

        // not support
        if (!font.support) {
            res.statusCode = 404;
            next();
            return;
        }

        // 404
        if (!font.srcPath || !storage.has(font.srcPath)) {
            res.statusCode = 404;
            next();
            return;
        }

        // igonre dest hash
        var sourceHash = font.pathname.indexOf(opts.dest) > -1
            ? font.basename
            : font.hash;

        // destPath
        var destPath = path.join(opts.dest, sourceHash + font.ext);

        // cache
        if (storage.has(destPath)) {

            send(destPath);

        }
        // run minify
        else {

            fontmin(
                font,
                opts,
                function (err, files) {

                    // fontmin err
                    if (err) {
                        res.statusCode = 502;
                        next(err);
                        return;
                    }

                    // send file
                    sendDest(files, font);

                }
            );

        }


    };

}



