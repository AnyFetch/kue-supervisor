'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');

// Load configuration and initialize server
var config = require('../config/configuration.js');

var app = express();
app.use(bodyParser());

var components = url.parse(config.redisUrl);

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

module.exports = app;