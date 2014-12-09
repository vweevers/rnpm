var fs = require('fs')
  , path = require('path')
  , util = require('./util')
  , filterFiles = require('filter-files')
  , isDir = require('is-directory')
  , after = require('after')

var maxDepth = 5

// TODO: cache results
module.exports = function analyze(options, callback) {

  var cwd = process.cwd()
    , depsPerDir = {
      '.': {}
      }
    , inconsistencies = {}
    , consolidated = []
    , components = []

  // Iterate through all directories
  getPackages(cwd, function(err, files){
    if (err) throw err

    var next = after(files.length, function(){
      callback && callback(depsPerDir, inconsistencies, consolidated, components)
    })

    files.forEach(function(pkgFile){
      var dir = path.dirname(pkgFile)
        , relative = path.relative(cwd, dir)
        , pkg = require(pkgFile)

      components.push(relative || '.')

      // Collect dependencies
      if (pkg.dependencies)
        addDependencies(pkg.dependencies, relative, 'production')
      if (pkg.devDependencies)
        addDependencies(pkg.devDependencies, relative, 'development')

      // Check for existence of previous .rnpm
      fs.exists(path.join(dir, '.rnpm', 'package.json'), function(exists) {
        if (exists) consolidated.push(relative || '.')
        next()
      })
    })
  })

  function addDependencies(deps, dir, type) {
    for (dep in deps) {
      var version = deps[dep];

      // Try to add dependencies to root directory
      if (!depsPerDir['.'][dep]) {
        depsPerDir['.'][dep] = { version: version, type: type };
      } else {
        // check for inconsistent dependency versions.
        if (depsPerDir['.'][dep].version != version) {
          if (!options.silent) {
            util.warn('analyze', dir + ': inconsistent dependency version ' + dep + '@' + version)
          }

          // Store inconsistencies
          if (!inconsistencies[dep]) {
            inconsistencies[dep] = [depsPerDir['.'][dep].version]
          }

          if (inconsistencies[dep].indexOf(version) == -1) {
            inconsistencies[dep].push(version);
          }

          // create dir entry if necessary
          if (!depsPerDir[dir]) {
            depsPerDir[dir] = {}
          }

          // Add dependency to nested directory
          depsPerDir[dir][dep] = { version: version, type: type }
        }
      }
    }
  }
}

function getPackages(root, callback) {
  filterFiles(root, function filter(name, parent){
    if (name[0]=='.' || name=='node_modules') return false

    var abs   = path.join(parent, name)
      , depth = path.relative(root, abs).split(/\/|\\/).length-1

    if (depth>maxDepth) return false
    if (name=='package.json' || isDir(abs)) return true
  }, callback)
}
