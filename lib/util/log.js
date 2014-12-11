/**
 * Module Dependencies
 */

var ansi = require('ansi')
  , out = ansi(process.stdout)
  , error = ansi(process.stderr)

module.exports = log

/**
 * Write a log message
 */

function log(m, M) {
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

log.warn = function (m, M) {
  error.write('rnpm ').black().bg.yellow().write('WARN').reset().bg.reset().write(' ');
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

log.error = function (m, M) {
  error.write('rnpm ').red().write('ERR! ').reset();
  if (arguments.length == 2) {
    error.magenta().write(m + ' ').reset().write(M);
  } else {
    error.write(m);
  }
  error.write('\n');
}
