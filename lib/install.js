var fs = require('fs')
  , path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , log = require('./util/log')
  , assertOptions = require('./util/assert-options')
  , symlinks = require('./util/symlinks')
  , rimraf = require('rimraf')

function errback(err) {
  if (err) throw err
}

module.exports = function install(options, callback) {
  assertOptions(options)

  var cwd = options.cwd
  callback = callback || errback

  // analyze dependencies
  analyze(options, install)

  // install everything
  function install(depsPerDir, inconsistencies, _, components) {

    if (options.strict && Object.keys(inconsistencies).length > 0) {
      log.error('strict mode', 'Failing because of inconsistent dependencies.')
      return process.exit(-1);
    }

    var dirs = Object.keys(depsPerDir)

    // install each directory with dependencies
    function installDir(i, didSymlink) {
      // create symlinks *before* npm install, so npm skips these
      // TODO: refactor to outside of installDir()
      if (i === 0 && !didSymlink) {
        return symlinks.linkComponents(cwd, components, function(err){
          if (err) return callback(err)
          installDir(0, true)
        })
      }

      if (i >= dirs.length) {
        return callback()
      }

      var dir = dirs[i]
      if (dir !== '.') log('install', dir)

      var dotrnpm = path.join(cwd, dir, '.rnpm')
      var link = path.join(cwd, dir, 'node_modules')

      if (fs.existsSync(dotrnpm)) {
        log.warn('install', 'removing legacy .rnpm and node_modules in: ' + path.join(cwd, dir))

        // remove node_modules too, because it links to .rnpm
        rimraf.sync(link)
        rimraf.sync(dotrnpm)
      }

      // write deps to `.rnpm/package.json`
      var dependencies = {}, devDependencies = {};

      for (var dep in depsPerDir[dir]) {
        if (fs.existsSync(path.join(cwd, 'packages', dep))) {
          continue
        }

        if (depsPerDir[dir][dep].type == 'production') {
          dependencies[dep] = depsPerDir[dir][dep].version
        } else {
          devDependencies[dep] = depsPerDir[dir][dep].version
        }
      }

      var pkgJson = {
        name: '-rnpm-consolidated-module',
        version: '1.0.0',
        private: true,
        dependencies: dependencies,
        devDependencies: devDependencies
      }

      replaceOriginalPackage(path.join(cwd, dir), pkgJson)

      npm.prefix = path.join(cwd, dir);
      npm.config.set('production', !!options.production);
      npm.config.set('ignore-scripts', !!options.ignoreScripts);

      npm.commands.install([], function(err) {
        restoreOriginalPackage(path.join(cwd, dir))

        if (err) throw err;
        installDir(i+1)
      })
    }

    installDir(0)
  }
}

function restoreOriginalPackage (dir) {
  var real = path.join(dir, 'package.json')
  var original = path.join(dir, 'package-original.json')

  if (fs.existsSync(original)) {
    fs.renameSync(original, real)
  }
}

function replaceOriginalPackage (dir, pkg) {
  var real = path.join(dir, 'package.json')
  var original = path.join(dir, 'package-original.json')

  fs.renameSync(real, original)
  fs.writeFileSync(real, JSON.stringify(pkg, null, '  ') + '\n');
}
