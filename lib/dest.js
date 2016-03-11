/**
 * @file 基于文件的简单结果管理
 *
 */

var fs = require('fs');
var resolve = require('path').resolve;

function Dest (root) {
    this.root = root;
}

Dest.prototype.getPath = function(key) {
    return resolve(this.root, key);
};

Dest.prototype.has = function(key) {
    return fs.existsSync(this.getPath(key));
};

module.exports = Dest
