<p align="center">
    <a href="https://github.com/junmer/serve-fontmin">
        <img height="128" width="128" src="https://raw.githubusercontent.com/ecomfe/fontmin/master/fontmin.png">
    </a>
</p>

# serve-fontmin 
[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Dependencies][dep-image]][dep-url]
[![Coverage Status][cov-image]][cov-url]

> fontmin serving middleware 

## Usage

### server

```javascript
var express = require('express');
var fontmin = require('serve-fontmin');
var app = express();

app.use('/static', fontmin('public/font'));

var server = app.listen(8090, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

```

### browser

basic

```
${pathname}/${filename}.css?text=${text}
```

optional font-family

```
${pathname}/${filename}.css?text=${text}&name=${fontFamily}
```

## API

### fontmin(path, [options])

Path:

source font path.

Options:

- `headers`     headers of response to serve, optional.
- `oppressor`   compression response, defaults false.
- `base64`      inject base64 data:application/x-font-ttf; (gzip font with css). defaults false
- `storage`     storage plugin, if you want to use a Storage Service like `AWS`, `BOS` instead `fs`, optional.

## Example

```sh
$ cd example
$ npm i
$ node app.js
```

open <http://127.0.0.1:8090/index.html>

## Related

- [express](http://expressjs.com)
- [fontmin](http://ecomfe.github.io/fontmin/)
- [senty font][font-url]

## License

MIT © fontmin

[travis-url]: https://travis-ci.org/junmer/serve-fontmin
[travis-image]: http://img.shields.io/travis/junmer/serve-fontmin.svg

[downloads-image]: http://img.shields.io/npm/dm/serve-fontmin.svg
[npm-url]: https://npmjs.org/package/serve-fontmin
[npm-image]: http://img.shields.io/npm/v/serve-fontmin.svg

[dep-url]: https://david-dm.org/junmer/serve-fontmin
[dep-image]: http://img.shields.io/david/junmer/serve-fontmin.svg

[cov-image]: https://coveralls.io/repos/github/junmer/serve-fontmin/badge.svg?branch=master
[cov-url]: https://coveralls.io/github/junmer/serve-fontmin?branch=master

[font-url]: http://font.sentywed.com/
