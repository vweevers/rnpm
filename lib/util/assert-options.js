var assert = require('assert')
  , fs = require('fs')

module.exports = function (options) {
  assert(options)
  var cwd = options.cwd
  assert(cwd && cwd.trim(), 'cwd cannot be empty')
  assert(fs.existsSync(cwd), 'cwd must exist: `'+cwd+'`')
}
