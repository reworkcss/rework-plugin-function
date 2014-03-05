
var rework = require('rework')
  , fs = require('fs')
  , assert = require('assert')
  , read = fs.readFileSync;

function fixture(name) {
  return read('test/fixtures/' + name + '.css', 'utf8').trim();
}

describe('.function()', function(){
  it('should add custom function', function(){
    rework(fixture('function'))
      .use(rework.function({ fonts: fonts }))
      .toString()
      .should.equal(fixture('function.out'));

    function fonts() {
      var files = Array.prototype.slice.call(arguments);
      var types = { woff: 'woff', ttf: 'truetype', otf: 'opentype' };
      return files.map(function(file){
        var ext = file.replace(/^.*\./, '');
        return 'url(' + file + ') format("' + types[ext] + '")';
      }).join(', ');
    }
  })

  it('should support nested function', function() {
    var functions = {
      subtract: function(a, b) { return a - b },
      multiply: function(a, b) { return a * b },
      divide: function(a, b) { return a / b },
      floor: Math.floor
    }

    rework(fixture('function.nested'))
      .use(rework.function(functions))
      .toString()
      .should.equal(fixture('function.nested.out'));
  })

  it('should prevent infinite loop', function() {
    rework(fixture('function.infinite-loop'))
      .use(rework.function({url: prefixurl}))
      .toString()
      .should.equal(fixture('function.infinite-loop.out'));

    function prefixurl(path) {
      return 'url(' + '/some/prefix' + path + ')';
    }
  })
})
