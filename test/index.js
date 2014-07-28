'use strict';

require('should');
var supertest = require("supertest");

var app = require('../app.js');


describe('/', function() {
  it("shoud return a valid HTTP page", function(done) {
    supertest(app)
      .get('/')
      .expect(200)
      .end(done);
  });
});
