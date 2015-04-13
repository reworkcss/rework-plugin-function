
/**
 * Module dependencies.
 */

var visit = require('rework-visit');

/**
 * Define custom function.
 */

module.exports = function(functions, args) {
  if (!functions) throw new Error('functions object required');
  return function(style){
    var functionMatcher = functionMatcherBuilder(Object.keys(functions).join('|'));

    visit(style, function(declarations){
      func(declarations, functions, functionMatcher, args);
    });
  }
};

/**
 * Visit declarations and apply functions.
 *
 * @param {Array} declarations
 * @param {Object} functions
 * @param {RegExp} functionMatcher
 * @param {Boolean} [parseArgs]
 * @api private
 */

function func(declarations, functions, functionMatcher, parseArgs) {
  if (!declarations) return;
  if (false !== parseArgs) parseArgs = true;

  declarations.forEach(function(decl){
    if ('comment' == decl.type) return;
    var replacedFunctions = [], replacedValues = [], result, replacedFunc, replacedValue;

    var colorFunctionRegexPart = "(?:rgb|hsl)a?";
    var colorMatcher = functionMatcherBuilder(colorFunctionRegexPart);
    var replaceColorValues = function(value_str){
      while (value_str.match(colorMatcher)) {
        value_str = value_str.replace(colorMatcher, function(color, name, args){
          replacedValue = {from: color, to: getRandomIdentifier(name)};
          replacedValues.push(replacedValue);
          return replacedValue.to;
        });
      }
      return value_str;
    };

    decl.value = replaceColorValues(decl.value);

    while (decl.value.match(functionMatcher)) {
      decl.value = decl.value.replace(functionMatcher, function(_, name, args){
        if (parseArgs) {
          args = args.split(/\s*,\s*/).map(strip);
        } else {
          args = [strip(args)];
        }
        args = args.map(function(arg){
          replacedValues.forEach(function(func) {
            arg = arg.replace(func.to, func.from);
          });
          return arg;
        });
        // Ensure result is string
        result = '' + functions[name].apply(decl, args);

        result = replaceColorValues(result);

        // Prevent fall into infinite loop like this:
        //
        // {
        //   url: function(path) {
        //     return 'url(' + '/some/prefix' + path + ')'
        //   }
        // }
        //
        replacedFunc = {from: name, to: getRandomIdentifier(name)};
        result = result.replace(functionMatcherBuilder(name), replacedFunc.to + '($2)');
        replacedFunctions.push(replacedFunc);
        return result;
      });
    }

    replacedFunctions.forEach(function(func) {
      decl.value = decl.value.replace(func.to, func.from);
    });

    replacedValues.forEach(function(func) {
      decl.value = decl.value.replace(func.to, func.from);
    });

  });
}

/**
 * Build function regexp
 *
 * @param {String} name
 * @api private
 */

function functionMatcherBuilder(name) {
  // /(?!\W+)(\w+)\(([^()]+)\)/
  return new RegExp("(?!\\W+)(" + name + ")\\(([^\(\)]+)\\)");
}

/**
 * Generate a random string to use as an identifier replacing a function
 *
 * @api private
 */

function getRandomIdentifier(name) {
  return name + Math.random().toString(36).slice(2);
}

/**
 * strip quotes from string
 * @api private
 */

function strip(str) {
    if ('"' == str[0] || "'" == str[0]) return str.slice(1, -1);
    return str;
}
