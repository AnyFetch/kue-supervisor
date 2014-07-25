'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var request = require('superagent');
var cluster = require('cluster');

// Load configuration and initialize server
var config = require('./config/configuration.js');

var app = express();
app.use(bodyParser());

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

module.exports = app;