var path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , util = require('./util')
  , after = require('after')
  , each = require('each')

module.exports = function custom(command, onConsolidated, options, args, callback) {
  if (typeof args == 'function') callback = args, args = []

  var cwd = process.cwd()

  if (!options) options = {}
  if (!args) args = []

  // Initialize NPM as a lib
  npm.load({}, function() {
    // analyze dependencies
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

        for(var k in options) npm.config.set(k, options[k])
        var _args = args.concat(next)
        npm.commands[command].apply(null, _args)
      })

      iterator.on('both', function(err){
        if (err) util.error(command, last)
        if (callback) return callback(err)
        else if (err) throw err
      })
    })
  })
}
