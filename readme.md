serve-fontmin
===

# Usage

```
var express = require('express');
var serveFontmin = require('serve-fontmin');
var app = express();

app.use('/static', serveFontmin('public/font'));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

```

open <http://127.0.0.1:3000/static/fontname.css?text=百度一下，你就知道>
