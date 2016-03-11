/**
 * @file simple storage base fs
 * @author junmer
 */

var fs = require('fs');
var resolve = require('path').resolve;
var vfs = require('vinyl-fs');

function Storage(root) {
    this.root = root;
}

Storage.prototype.getPath = function (key) {
    return resolve(this.root, key);
};

Storage.prototype.has = function (key) {
    return fs.existsSync(this.getPath(key));
};

Storage.prototype.src = function (key) {
    return vfs.src(key, {cwd: this.root});
};

Storage.prototype.dest = function (key) {
    return vfs.dest(key, {cwd: this.root});
};

Storage.prototype.createReadStream = function (key) {
    return this.has(key)
        ? fs.createReadStream(this.getPath(key))
        : null;
};

Storage.prototype.createWriteStream = function (key) {
    return fs.createWriteStream(this.getPath(key));
};


module.exports = Storage;
