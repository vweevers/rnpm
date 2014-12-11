var path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , log = require('./util/log')
  , assertOptions = require('./util/assert-options')
  , each = require('each')
  , clone = require('clone')
  , writeFileAtomic = require("npm/node_modules/write-file-atomic")
  , readJson = require("npm/node_modules/read-package-json")
  , sortedObject = require("npm/node_modules/sorted-object")

// todo:
// - install the above npm deps
// - shrinkwrap creates .rnpm/npm_shrinkwrap.json, 
//   is that desirable for version control?
// - remove extraneous shrinkwrap files from 
//   previously consolidated components
// - cleanup comments..
module.exports = function shrinkwrap(options, callback) {
  assertOptions(options)

  var cwd = options.cwd

  analyze(options, function (_, _, consolidated) {
    ls(consolidated, function(err){
      if (callback) return callback(err)
      else if (err) throw err
    })
  })

  function ls(consolidated, done) {
    var last, iterator = each(consolidated)

    iterator.on('item', function(dir, idx, next){
      last = dir; log('shrinkwrap', dir)

      npm.prefix = path.join(cwd, dir, '.rnpm')

      // true == silent
      npm.commands.ls([], true, function (er, _, pkginfo) {
        if (er) return next(er)
        _shrinkwrap(dir, pkginfo, next)
      })
    })

    iterator.on('both', function(err){
      if (err) log.error('shrinkwrap', last)
      done(err)
    })
  }
}

// Code is mostly copied from npm shrinkwrap
function _shrinkwrap(dir, pkginfo, done) {
  // since components are symlinked into node_modules,
  // npm.ls will mark those as extraneous in .problems and .dependencies
  if (pkginfo.problems) {
    // format is `extraneous: name@version path`
    // we should compare the name with component names,
    // but for now just remove all `extraneous` listings
    var problems = pkginfo.problems.filter(function(problem){
      return problem.slice(0, 10)!=='extraneous'
    })

    if (problems.length) {
      log.warn('shrinkwrap', 
        dir+': problems were encountered. Due to a shortcoming of `npm ls`, ' +
        'they might pertain to devDependencies.\n > '+
        problems.join("\n > ") + '\n'
      )
    }

    delete pkginfo.problems
  }

  // remove dev deps (unless the dep is also listed as dependency)
  readJson(path.resolve(npm.prefix, "package.json"), function (er, data) {
    if (er) return done(er)

    if (data.devDependencies) {
      Object.keys(data.devDependencies).forEach(function (dep) {
        if (data.dependencies && data.dependencies[dep]) return
        delete pkginfo.dependencies[dep]
      })
    }

    // extraneous packages are also listed in dependencies
    Object.keys(pkginfo.dependencies).forEach(function (dep) {
      if (pkginfo.dependencies[dep].extraneous)
        delete pkginfo.dependencies[dep]
    })

    save(dir, pkginfo, false, done)
  })
}

// Code is mostly copied from npm shrinkwrap
function save (dir, pkginfo, silent, done) {
  // copy the keys over in a well defined order
  // because javascript objects serialize arbitrarily
  pkginfo.dependencies = sortedObject(pkginfo.dependencies || {})
  
  var swdata
  try {
    swdata = JSON.stringify(pkginfo, null, 2) + "\n"
  } catch (er) {
    log.error("shrinkwrap", dir+": error converting package info to json")
    return done(er)
  }

  var file = path.resolve(npm.prefix, "npm-shrinkwrap.json")

  writeFileAtomic(file, swdata, function (er) {
    if (er) return done(er)
    if (!silent) log('shrinkwrap', dir+": wrote npm-shrinkwrap.json")
    done(null, pkginfo)
  })
}
