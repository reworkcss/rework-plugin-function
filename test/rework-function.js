
var rework = require('rework')
  , func = require('../')
  , fs = require('fs')
  , assert = require('assert')
  , read = fs.readFileSync;

function fixture(name) {
  return read('test/fixtures/' + name + '.css', 'utf8')
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ");
}

describe('.function()', function(){
  it('should add custom function', function(){
    rework(fixture('function'))
      .use(func({ fonts: fonts }))
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
      .use(func(functions))
      .toString()
      .should.equal(fixture('function.nested.out'));
  })

  it('should prevent infinite loop', function() {
    rework(fixture('function.infinite-loop'))
      .use(func({url: prefixurl}))
      .toString()
      .should.equal(fixture('function.infinite-loop.out'));

    function prefixurl(path) {
      return 'url(' + '/some/prefix' + path + ')';
    }
  })
  
  it('should support (function-like) color values as parameters', function() {
    
    rework(fixture('function.colors'))
      .use(func({"ugly-border": uglyBorder}))
      .toString()
      .should.equal(fixture('function.colors.out'));

    function uglyBorder(top, right, bottom, left){
      return top + ' ' + right + ' ' + bottom + ' ' + left;
    }
  })
  
  it('should support (function-like) color values nested in parameters', function() {
    
    rework(fixture('function.colors.nested'))
      .use(func({mix: mix, alpha: alpha}))
      .toString()
      .should.equal(fixture('function.colors.nested.out'));

    function mix(colorA, colorB, x){
      if(colorA === '#333' && colorB === '#FFF' && x == 0.4){
        return 'rgb(132, 132, 132)';
      }else{
        throw new Error('Unexpected arguments to mix(): ' + [colorA, colorB, x]);
      }
    }

    function alpha(color, x){
      if(color === 'rgb(132, 132, 132)' && x == 0.8){
        return 'rgba(132, 132, 132, 0.8)';
      }else{
        throw new Error('Unexpected arguments to alpha(): ' + [color, x]);
      }
    }
  })
})
