"use strict";

// Load environment variables from .env file
var dotenv = require('dotenv');
dotenv.load();

module.exports = {
  port: process.env.QUEUE_PORT || process.env.PORT || 3000,
  redisUrl: process.env.REDIS_URL || "redis://localhost",

  username: process.env.USER,
  password: process.env.PASS
};