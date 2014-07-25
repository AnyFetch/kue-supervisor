'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var cluster = require('cluster');
var request = require('superagent');

// Load configuration and initialize server
var config = require('../config/configuration.js');

var app = express();
app.use(bodyParser());

var components = url.parse(config.redisUrl);

if(cluster.isMaster) {
  var confQueues = [
    {
      name: "dropbox",
      prefix: "http://localhost:8000",
      port: config.port + 1
    },
    {
      name: "gmail",
      prefix: "http://localhost:5000",
      port: config.port + 2
    }
  ];

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

  app.listen(config.port, function() {
    console.log("Server listen on port " + config.port);
  });
} else {
  var kue = require('kue');

  kue.createQueue({
    prefix: process.env.QUEUE_PREFIX,
    redis: {
      port: components.port || 6379,
      host: components.hostname || "localhost",
      auth: (components.auth) ? ((components.auth.split(':').length > 1) ? components.auth.split(':')[1] : components.auth) : undefined,
    },
    disableSearch: true
  });

  kue.app.set('title', 'Kue supervisor - ' + process.env.QUEUE_NAME);
  app.use('/', kue.app);

  app.listen(process.env.QUEUE_PORT, function() {
    console.log("Queue `" + process.env.QUEUE_PREFIX + "` listen into `/" + process.env.QUEUE_NAME + "`");
  });
}
