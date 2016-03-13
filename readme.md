# serve-fontmin 
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Dependencies][dep-image]][dep-url]

> fontmin serving middleware 

## Usage

```javascript
var express = require('express');
var serveFontmin = require('serve-fontmin');
var app = express();

app.use('/static', serveFontmin('public/font'));

var server = app.listen(8090, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

```

## API

`${origin}/static/${filename}.css?text=${text}`

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

[downloads-image]: http://img.shields.io/npm/dm/serve-fontmin.svg
[npm-url]: https://npmjs.org/package/serve-fontmin
[npm-image]: http://img.shields.io/npm/v/serve-fontmin.svg

[dep-url]: https://david-dm.org/junmer/serve-fontmin
[dep-image]: http://img.shields.io/david/junmer/serve-fontmin.svg

[font-url]: http://font.sentywed.com/
