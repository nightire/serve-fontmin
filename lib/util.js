var crypto = require('crypto');
var path = require('path');

exports.md5 = function (str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
};

exports.replaceExt = function(npath, ext) {
    if (typeof npath !== 'string') return npath;
    if (npath.length === 0) return npath;

    var nFileName = path.basename(npath, path.extname(npath)) + ext;
    return path.join(path.dirname(npath), nFileName);
};
