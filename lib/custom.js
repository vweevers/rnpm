var path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , util = require('./util')
  , after = require('after')
  , each = require('each')

module.exports = function custom(command, options, callback) {
  var cwd = process.cwd()

  if (!options) options = {}

  // Initialize NPM as a lib
  npm.load({}, function() {
    // analyze dependencies
    analyze(options, function (depsPerDir, _, consolidated) {
      var last, iterator = each(consolidated)

      iterator.on('item', function(dir, idx, next){
        last = dir
        util.log(command, dir)
        
        // run command inside the `.rpnm` directory
        npm.prefix = path.join(cwd, dir, '.rnpm');
        for(var k in options) npm.config.set(k, options[k])
        npm.commands[command]([], next)
      })

      iterator.on('both', function(err){
        if (err) util.error(command, last)
        if (callback) return callback(err)
        else if (err) throw err
      })
    })
  })
}
