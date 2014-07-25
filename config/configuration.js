"use strict";

// Load environment variables from .env file
var dotenv = require('dotenv');
dotenv.load();

module.exports = {
  port: process.env.PORT || 3000,
};