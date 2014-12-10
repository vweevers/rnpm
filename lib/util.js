/**
 * Module Dependencies
 */

var ansi = require('ansi')
  , out = ansi(process.stdout)
  , error = ansi(process.stderr)
  , assert = require('assert')
  , fs = require('fs')

/**
 * Write a log message
 */

exports.log = function (m, M) {
  out.write('rnpm ').green().write('info ').reset();
  if (arguments.length == 2) {
    out.magenta().write(m + ' ').reset().write(M);
  } else {
    out.write(m);
  }
  out.write('\n');
}

/**
 * Write a warning message
 */

exports.warn = function (m, M) {
  error.write('rnpm ').black().bg.red().write('WARN').reset().bg.reset().write(' ');
  if (arguments.length == 2) {
    error.magenta().write(m + ' ').reset().write(M);
  } else {
    error.write(m);
  }
  error.write('\n');
}


/**
 * Write an error message
 */

exports.error = function (m, M) {
  error.write('rnpm ').red().write('ERR! ').reset();
  if (arguments.length == 2) {
    error.magenta().write(m + ' ').reset().write(M);
  } else {
    error.write(m);
  }
  error.write('\n');
}

exports.assertOptions = function(options) {
  assert(options)
  var cwd = options.cwd
  assert(cwd && cwd.trim(), 'cwd cannot be empty')
  assert(fs.existsSync(cwd), 'cwd must exist: `'+cwd+'`')
}
