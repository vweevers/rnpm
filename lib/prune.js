var path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , util = require('./util')
  , after = require('after')
  , rimraf = require('rimraf')

module.exports = function prune(options, callback) {

  var cwd = process.cwd()

  // Initialize NPM as a lib
  npm.load({}, function() {

    // analyze dependencies
    analyze(options, function (depsPerDir, _, consolidated) {

      var next = after(consolidated.length, function(err){
        if (err) throw err
        // util.log('prune', 'Done.');
        return callback && callback()
      })

      consolidated.forEach(function(dir){
        // If dir has no overriding dependencies, 
        // remove .rnpm (root is skipped)
        if (dir!='.' && !depsPerDir[dir]) {
          var _next = after(2, next)

          remove('.rnpm')
          remove('node_modules')
          
          function remove(sub) {
            var full = path.join(cwd, dir, sub)
            rimraf(full, function(err){
              if (err) {
                util.error('prune', dir + ': could not remove `'+full+'`')
              } else {
                util.log('prune', dir + ': removed '+sub)
              }
              _next()
            })
          }
        } else {
          util.log('prune', dir)
          
          // prune deps inside the `.rpnm` directory
          npm.prefix = path.join(cwd, dir, '.rnpm');
          npm.config.set('production', !!options.production);
          npm.commands.prune([], next)
        }
      })
    })
  })
}

