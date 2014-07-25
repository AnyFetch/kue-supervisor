'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var request = require('superagent');
var cluster = require('cluster');
var redis = require('redis');
var url = require('url');

// Load configuration and initialize server
var config = require('./config/configuration.js');

var app = express();
app.use(bodyParser());

var components = url.parse(config.redisUrl);

var client = redis.createClient(components.port || 6379, components.hostname || "localhost", {
  auth_pass: (components.auth) ? ((components.auth.split(':').length > 1) ? components.auth.split(':')[1] : components.auth) : undefined
});

client.on('error', function(err) {
  console.warn('ERROR:', err);
});

client.keys("*:ids", function (err, keys) {
  if(err) {
    return console.warn('ERROR:', err);
  }

  var confQueues = [];
  var port = config.port + 1;

  keys.forEach(function(key) {
    key = key.replace(':ids', '');

    var matches = key.match(/^https?:\/\/([a-zA-Z0-9]+)/);

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

    app.use('/' + confQueue.name, function(req, res) {
      if(req.url === "/") {
        req.url = "/active";
      }

      req.pipe(request("http://localhost:" + confQueue.port + req.url)).pipe(res);
    });
  });
});

module.exports = app;