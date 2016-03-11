/**
 * @file font url 解析
 * @author junmer
 */

var replaceExt = require('replace-ext');
var parseUrl = require('parseurl');
var querystring = require('querystring');
var path = require('path');
var util = require('./util');

var supports = {
    css: 1,
    ttf: 1,
    woff: 1,
    eot: 1,
    svg: 1
};


exports.parse = function (req) {

    var parsedFont = parseUrl(req);

    delete parsedFont.href;

    var query = querystring.parse(parsedFont.query);
    var text = parsedFont.text = query.text || '';

    var pathname = parsedFont.pathname = parsedFont.pathname.substring(1);
    var ext = parsedFont.ext = path.extname(pathname);

    if (supports[ext.replace('.', '')]) {
        parsedFont.support = true;
    }
    else {
        return parsedFont;
    }

    var basename = parsedFont.basename = path.basename(pathname, ext);
    parsedFont.hash = [basename, util.md5(text)].join('-');
    parsedFont.srcPath = replaceExt(pathname, '.ttf');

    return parsedFont;

};
