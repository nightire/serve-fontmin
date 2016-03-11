var express = require('express');
var app = express();

var serveFontmin = require('../');

app.use(express.static('public'));
app.use('/static', serveFontmin('public/font'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

var server = app.listen(8090, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
