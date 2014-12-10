var path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , util = require('./util')
  , after = require('after')
  , each = require('each')
  , clone = require('clone')

module.exports = function custom(command, onConsolidated, options, args, callback) {
  if (typeof args == 'function') callback = args, args = []

  util.assertOptions(options)

  var cwd = options.cwd
  if (!args) args = []

  analyze(options, function (_, _, consolidated, components) {
    var a = onConsolidated ? consolidated : components
      , last, iterator = each(a)

    iterator.on('item', function(dir, idx, next){
      last = dir
      util.log(command, dir)

      if (onConsolidated) // run in `.rpnm` directory
        npm.prefix = path.join(cwd, dir, '.rnpm')
      else // run in component directory
        npm.prefix = path.join(cwd, dir)

      for(var k in options) if (k!='cwd') npm.config.set(k, options[k])
      var _args = clone(args).concat(next)
      npm.commands[command].apply(null, _args)
    })

    iterator.on('both', function(err){
      if (err) util.error(command, last)
      if (callback) return callback(err)
      else if (err) throw err
    })
  })
}
