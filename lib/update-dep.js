var fs = require('fs')
  , path = require('path')
  , log = require('./util/log')
  , assertOptions = require('./util/assert-options')
  , analyze = require('./analyze')
  , after = require('after')

module.exports = function updateDep(options, callback) {
  assertOptions(options)
  
  var cwd = options.cwd
    , dependency = options.dependency
    , version = options.version

  analyze({silent: true, cwd: cwd}, function (_, inconsistencies, _, components) {
    var next = after(components.length, function(err){
      if (inconsistencies[dependency])
        delete inconsistencies[dependency]
      if (callback) callback(err)
      else if (err) throw err
    })

    components.forEach(function(relative){
      var pkgFile = path.join(cwd, relative, 'package.json')
        , pkg = require(pkgFile)
        , changed = update(pkg.dependencies) | update(pkg.devDependencies);

      if (!changed) return next()

      log('update-dep', 'Updating ' + path.join(relative, 'package.json'));
      
      var json = JSON.stringify(pkg, null, '  ') + '\n'
      fs.writeFile(pkgFile, json, 'utf-8', next)
    })
  })

  // Update a dependency
  function update(deps) {
    if (deps && deps[dependency] && deps[dependency]!==version) {
      deps[dependency] = version;
      return true;
    }
  }
}
