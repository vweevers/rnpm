exports.install = require('./install')
exports.analyze = require('./analyze')
exports.updateDep = require('./update-dep')
exports.normalize = require('./normalize')
exports.prune = require('./prune')
exports.custom = require('./custom')
exports.execute = require('./execute')
exports.shrinkwrap = require('./shrinkwrap')

exports.test = function(options, callback) {
  exports.custom('test', false, options, [], callback)
}

exports.run = function(script, options, callback) {
  var args = []
  if (script) args.push([script])
  exports.custom('run-script', false, options, args, callback)
}

exports.update = function(options, callback) {
  exports.custom('update', true, options, [], callback)
}

exports.rebuild = function(options, callback) {
  exports.custom('rebuild', true, options, [], callback)
}
