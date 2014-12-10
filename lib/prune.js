var path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , util = require('./util')
  , after = require('after')
  , rimraf = require('rimraf')
  , each = require('each')

module.exports = function prune(options, callback) {
  util.assertOptions(options)
  var cwd = options.cwd

  // analyze dependencies
  analyze(options, function (depsPerDir, _, consolidated) {
    var last, iterator = each(consolidated)

    iterator.on('item', function(dir, idx, next){
      last = dir

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

    iterator.on('both', function(err){
      if (err) util.error('prune', last)
      if (callback) return callback(err)
      else if (err) throw err
    })
  })
}

