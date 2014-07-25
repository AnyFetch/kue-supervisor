"use strict";

// Load configuration and initialize server
var config = require('./config/configuration.js');

var express = require('express');
var bodyParser = require('body-parser');
var kue = require('kue');

var app = express();

// Expose the server
module.exports = app;
