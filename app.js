'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth-connect');
var http = require('http');
var cluster = require('cluster');
var redis = require('redis');
var url = require('url');

// Load configuration and initialize server
var config = require('./config/configuration.js');

var app = express();

app.use(bodyParser());

if(config.username && config.password) {
  app.use(basicAuth(config.username, config.password));
}

var components = url.parse(config.redisUrl);

var client = redis.createClient(components.port || 6379, components.hostname || "localhost", {
  auth_pass: (components.auth) ? ((components.auth.split(':').length > 1) ? components.auth.split(':')[1] : components.auth) : undefined
});

client.on('error', function(err) {
  console.warn('ERROR:', err);
});

var confQueues = [];

client.keys("*:ids", function(err, keys) {
  if(err) {
    return console.warn('ERROR:', err);
  }

  var port = parseInt(config.port) + 1;

  keys.forEach(function(key) {
    key = key.replace(':ids', '');

    var matches = key.match(/^https?:\/\/([a-zA-Z0-9]+)/);

    if(!matches) {
      return;
    }

    confQueues.push({
      name: matches[1],
      prefix: key,
      port: port
    });

    port += 1;
  });

  confQueues.forEach(function(confQueue) {
    cluster.fork({
      QUEUE_PREFIX: confQueue.prefix,
      QUEUE_NAME: confQueue.name,
      QUEUE_PORT: confQueue.port
    });

    app.use('/' + confQueue.name, function(reqClient, resClient) {
      if(reqClient.url === "/") {
        reqClient.url = "/active";
      }

      http.get("http://localhost:" + confQueue.port + reqClient.url, function(resContent) {
        resClient.set(resContent.headers);
        resContent.pipe(resClient);
      });
    });
  });
});

app.engine('jade', require('jade').__express);
app.set('views', __dirname + "/views");
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  res.render('index', {queues: confQueues});
});

module.exports = app;
