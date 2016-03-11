/*
 * serve-fontmin
 */

// base
var path = require('path');
var fs = require('fs');
var parseUrl = require('parseurl');
var resolve = require('path').resolve;
var send = require('send');
var streamRename = require('stream-rename');
var Fontmin = require('fontmin');

// lib
var fontUrl = require('./lib/font-url');
var Dest = require('./lib/dest');

/**
 * Module exports.
 * @public
 */

module.exports = serveFontmin;

/**
 * outputStream
 *
 * @param  {stream}   stream
 * @param  {res}   res
 * @param  {Function} next
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
    })

    // pipe
    stream.pipe(res);
}

/**
 * serveFontmin
 *
 * @param {string} root
 * @param {object} [options]
 * @return {function}
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
    var dest = new Dest(resolve(opts.root, opts.dest));

    /**
     * serveFontmin
     *
     * @param  {req}   req
     * @param  {res}   res
     * @param  {Function} next
     */
    return function(req, res, next) {

        var font = fontUrl.parse(req);

        // parse fail
        if (!font.support) {
            res.statusCode = 404;
            next();
            return;
        }

        // srcPath
        var srcPath = resolve(opts.root, font.srcPath);

        // 404
        if (
            !font.srcPath ||
            !fs.existsSync(srcPath)
            ) {
            res.statusCode = 404;
            next();
            return;
        }

        // destPath
        var destPath = dest.getPath(font.hash + font.ext);

        if (dest.has(font.hash)) {
            var stream = send(req, destPath);
            outputStream(stream, res, next);
        }
        else {

            var fontmin = new Fontmin()
                .src(srcPath)
                .use(Fontmin.glyph({            // 字型提取插件
                    text: font.text             // 所需文字
                }))
                .use(streamRename({
                   basename: font.hash
                }))
                .use(Fontmin.ttf2eot(opts))     // eot 转换插件
                .use(Fontmin.ttf2woff(opts))    // woff 转换插件
                .use(Fontmin.ttf2svg(opts))     // svg 转换插件
                .use(Fontmin.css(opts))         // css 生成插件
                .dest(dest.root);               // 输出

            fontmin.run(function (err, files) {

                // 错误
                if (err) {
                    res.statusCode = 502;
                    next(err);
                    return;
                }

                // 没生出来
                if (files.length === 0) {
                    res.statusCode = 404;
                    next();
                    return;
                }

                // 在生产列表中找到并输出
                var finded = files.some(function (file) {

                    if (path.extname(file.path) == font.ext) {

                        var stream = send(req, destPath);
                        outputStream(stream, res, next);

                        return true;
                    }

                });

                // 没在生产列表中 404
                if (finded.length == 0) {
                    res.statusCode = 404;
                    next();
                    return;
                }

            });

        }


    };

}
