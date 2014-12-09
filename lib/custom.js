var path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , util = require('./util')
  , after = require('after')

module.exports = function custom(command, options, callback) {
  var cwd = process.cwd()

  if (!options) options = {}

  // Initialize NPM as a lib
  npm.load({}, function() {
    // analyze dependencies
    analyze(options, function (depsPerDir, _, consolidated) {
      var next = after(consolidated.length, function(err){
        if (err) throw err
        // util.log(command, 'Done.');
        return callback && callback()
      })

      consolidated.forEach(function(dir){
        util.log(command, dir)
        
        // run command inside the `.rpnm` directory
        npm.prefix = path.join(cwd, dir, '.rnpm');
        for(var k in options) npm.config.set(k, options[k])
        npm.commands[command]([], next)
      })
    })
  })
}
