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

process.on('exit', function() {
  for (var id in cluster.workers) {
    cluster.workers[id].kill();
  }
});

var components = url.parse(config.redisUrl);

var client = redis.createClient(components.port || 6379, components.hostname || "localhost", {
  auth_pass: (components.auth) ? ((components.auth.split(':').length > 1) ? components.auth.split(':')[1] : components.auth) : undefined
});

client.on('error', function(err) {
  console.warn('ERROR:', err);
});

var prefixesQueues = [];
var confQueues = [];

function refresh(cb) {
  client.keys("*:ids", function(err, keys) {
    if(err) {
      return cb(err);
    }

    var port = (confQueues.length === 0) ? ((config.slavePort) ? parseInt(config.slavePort) : parseInt(config.port) + 1) : confQueues[confQueues.length - 1].port + 1;

    keys.forEach(function(key) {
      key = key.replace(':ids', '');

      var matches = key.match(/^https?:\/\/([a-zA-Z0-9]+)/);

      if(!matches) {
        return;
      }

      if(prefixesQueues.indexOf(key) === -1) {
        confQueues.push({
          name: matches[1],
          prefix: key,
          port: port,
          launched: false
        });

        prefixesQueues.push(key);

        port += 1;
      }
    });

    confQueues.forEach(function(confQueue) {
      if(!confQueue.launched) {
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

        confQueue.launched = true;
      }
    });

    cb(null);
  });
}

refresh(function(err) {
  if(err) {
    console.warn('ERROR:', err);
  }
});

app.engine('jade', require('jade').__express);
app.set('views', __dirname + "/views");
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  res.render('index', {queues: confQueues});
});

app.get('/refresh', function(req, res) {
  refresh(function(err) {
    if(err) {
      console.warn('ERROR:', err);
      return res.send(500);
    }

    res.redirect('/');
  });
});

module.exports = app;
