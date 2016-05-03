var fs = require('fs')
  , path = require('path')
  , log = require('./util/log')
  , assertOptions = require('./util/assert-options')
  , filterFiles = require('filter-files')
  , isDir = require('is-directory')
  , after = require('after')
  , chain = require('slide').chain

var maxDepth = 10

module.exports = function version(options, callback) {
  callback = callback || errback

  // Require npm after config is loaded
  var npm = require('npm')
    , git = require('npm/lib/utils/git')

  assertOptions(options)

  var cwd = options.cwd
  var target = options.version ? options.version.toLowerCase() : false
  var gitAdd = []
  var names = []

  // Get root version and increment
  var current = (require(cwd+'/package.json').version || '0.0.0')

  if (!target) {
    console.log(current)
    return callback()
  }

  target = increment(current, target)

  // Recursively get packages
  getPackages(cwd, names, function(err, files){
    if (err) return callback(err)

    var next = after(files.length, function(err){
      if (err) return callback(err)
      var options = { env: process.env }

      chain(
        gitAdd.map(function(file) {
          return git.chainableExec([ 'add', file ], options)
        }),
        function(err) {
          if (err) return callback(err)

          // Update root version and git tag using npm version
          npm.prefix = cwd
          npm.config.set('git-tag-version', true)
          npm.config.set('force', true)
          npm.commands.version([target], callback)
        }
      )
    })

    files.forEach(function(pkgFile) {
      var dir = path.dirname(pkgFile)
        , relative = path.relative(cwd, dir)
        , pkg = require(pkgFile)

      // Skip root
      if (relative === '.' || relative === '') return next()

      // Update package version
      pkg.version = target

      // Update internal dependencies
      if (pkg.dependencies)
        updateDependencies(pkg.name, pkg.dependencies, target, names)
      if (pkg.devDependencies)
        updateDependencies(pkg.name, pkg.devDependencies, target, names)

      // Add git add command to chain
      gitAdd.push(path.relative(cwd, pkgFile))

      // Save package
      fs.writeFile(pkgFile, JSON.stringify(pkg, null, 2)+'\n', next)
    })
  })
}

function updateDependencies(owner, group, target, names) {
  Object.keys(group).forEach(function(dep) {
    if (names.indexOf(dep) >= 0) {
      group[dep] = '^'+target
    }
  })
}

function errback(err) {
  if (err) throw err
}

// TODO: make this a generic module (*-packages)
function getPackages(root, names, callback) {
  filterFiles(root, function filter(name, parent){
    if (name[0]=='.' || name=='node_modules') return false

    var abs   = path.join(parent, name)
      , depth = path.relative(root, abs).split(/\/|\\/).length-1

    if (depth>maxDepth) return false

    if (name === 'package.json' || isDir.sync(abs)) {
      if (name === 'package.json') names.push(require(abs).name)
      return true
    }
  }, callback)
}

function increment(current, target) {
  var a = current.split('.').map(Number), next

  // todo: <newversion> | premajor | preminor | prepatch | prerelease
  if (target === 'major') next = [ a[0] + 1, a[1]    , a[2]     ]
  else if (target === 'minor') next = [ a[0]    , a[1] + 1, a[2]     ]
  else if (target === 'patch') next = [ a[0]    , a[1]    , a[2] + 1 ]
  else throw new Error('Not implemented yet') // todo: validate semver

  return Array.isArray(next) ? next.join('.') : next
}
