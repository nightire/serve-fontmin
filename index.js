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

// lib
var fontUrl = require('./lib/font-url');
var Storage = require('./lib/storage');

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
    var opts = Object.create(options || null);

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

        var stream = storage.src(font.srcPath)
            .pipe(Fontmin.glyph({
                text: font.text
            })())
            .pipe(streamRename({
                basename: font.hash
            }))
            .pipe(Fontmin.ttf2eot(opts)())
            .pipe(Fontmin.ttf2woff(opts)())
            .pipe(Fontmin.ttf2svg(opts)())
            .pipe(Fontmin.css(opts)())
            .pipe(storage.dest(opts.dest));

        stream.on('error', callback);
        stream.pipe(concat(callback.bind(null, null)));

    }


    /**
     * sendFile
     *
     * @param  {Array}   files files
     * @param  {Object}   font font
     * @param  {res}   res   res
     * @param  {Function} next  next
     */
    function sendFile(files, font, res, next) {

        // empty src
        if (files.length === 0) {
            res.statusCode = 404;
            next();
            return;
        }

        // output dest
        var sended = files.some(function (file) {

            if (path.extname(file.path) === font.ext) {

                var stream = storage
                    .createReadStream(file.path);

                stream && stream.pipe(res);

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
     * serveFontmin
     *
     * @param  {req}   req request
     * @param  {res}   res response
     * @param  {Function} next next
     */
    return function (req, res, next) {

        /**
         * font info
         *
         * @type {Object}
         */
        var font = fontUrl.parse(req);

        // igonre dest hash
        var sourceHash = font.pathname.indexOf(opts.dest) > -1
            ? font.basename
            : font.hash;

        // destPath
        var destPath = path.join(opts.dest, sourceHash + font.ext);

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

        // cache
        if (storage.has(destPath)) {

            var stream = storage
                .createReadStream(destPath);

            stream && stream.pipe(res);

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
                    sendFile(files, font, res, next);

                }
            );

        }


    };

}



