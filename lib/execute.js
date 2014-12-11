var path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , log = require('./util/log')
  , assertOptions = require('./util/assert-options')
  , spawn = require('child_process').spawn
  , each = require('each')

// `options` is ignored for now, might be used for spawn options
// in the future
module.exports = function execute(command, options, args, callback) {
  assertOptions(options)

  var cwd = options.cwd
    , fullCommand = [command].concat(args).join(' ')

  if (!options) options = {}
  if (!args) args = []

  // analyze dependencies
  analyze(options, function (_, _, _, components) {
    var last, iterator = each(components)

    iterator.on('item', function(dir, idx, next){
      last = dir
      log('execute `'+fullCommand+'`', dir)
      
      // run command inside the component directory
      var spawnOpts = {
        cwd: path.join(cwd, dir),
        stdio: 'inherit'
      }

      spawn(command, args, spawnOpts).on('close', function(code){
        if (code!=0) {
          var e = new Error('Exited with code '+code);
          e.code = code;
        }
        next(e)
      }).on('error', next)
    })

    iterator.on('both', function(err){
      if (err) log.error('execute `'+fullCommand+'`', last)

      if (callback) return callback(err)
      else if (err) throw err
    })
  })
}
