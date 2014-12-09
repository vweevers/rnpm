var fs = require('fs')
  , path = require('path')
  , util = require('./util')
  , analyze = require('./analyze')
  , after = require('after')

module.exports = function updateDep(options, callback) {
  var cwd = process.cwd()

  analyze({silent: true}, function (_, _, _, components) {
    var next = after(components.length, function(err){
      if (callback) callback(err)
      else if (err) throw err
    })

    components.forEach(function(relative){
      var pkgFile = path.join(cwd, relative, 'package.json')
        , pkg = require(pkgFile)
        , changed = update(pkg.dependencies) | update(pkg.devDependencies);

      if (!changed) return next()

      util.log('update-dep', 'Updating ' + path.join(relative, 'package.json'));
      
      var json = JSON.stringify(pkg, null, '  ') + '\n'
      fs.writeFile(pkgFile, json, 'utf-8', next)
    })
  })

  // Update a dependency
  function update(deps) {
    if (deps && deps[options.dependency] && deps[options.dependency]!==options.version) {
      deps[options.dependency] = options.version;
      return true;
    }
  }
}
