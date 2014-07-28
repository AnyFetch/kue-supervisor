'use strict';

require('should');

describe('app.js', function() {
  it("shoud return a valid express application", function(done) {
    var app = require('../app.js');
    app.should.have.property('listen');
    done();
  });
});