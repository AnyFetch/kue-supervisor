'use strict';

var config = require("../config/configuration.js");
var cluster = require('cluster');

describe('Server', function() {
  it('should launch server', function(done) {
    if(cluster.isMaster) {
      var master = require('../app.js');

      // Start the server
      master.listen(config.port, function() {
        console.log("Server listening on port " + config.port);
        done();
      });
    }
    else {
      var slave = require('../lib/slave.js');

      slave.listen(config.port, function() {
        console.log("Server `" + process.env.QUEUE_NAME + "` listening on port " + config.port);
      });
    }
  });
});