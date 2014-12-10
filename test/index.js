var mr = require("npm-registry-mock")
  , install = require('../lib/install')
  , execute = require('../lib/execute')
  , rnpm = require('../lib/')
  , path = require('path')
  , test = require('tape')
  , rimraf = require('rimraf')
  , fs = require('fs')
  , npm = require('npm')
  , mkdirp = require('mkdirp')
  , tmpdir = require('os').tmpdir()
  , isPathInside = require('is-path-inside')
  , xtend = require('xtend')
  , mockServer

test('[setup]', function(t){
  mr(1331, function (server) {
    mockServer = server
    npm.load({ registry: "http://localhost:1331"}, function() {
      t.end()
    })
  })
})

test('install', function(t) {
  createProject(function(err, project) {
    if (err) throw err

    install({cwd: project}, function(){
      testStructure(project, t)
      t.end()
    })
  })  
})

test('install with pre-existing modules', function(t) {
  createProject(function(err, project){
    if (err) throw err

    mkdirp(path.join(project, 'node_modules/beep/boop'), function(err){
      if (err) throw err

      install({cwd: project}, function(){
        testStructure(project, t)

        var pre = path.join(project, 'node_modules/beep/boop')
        t.ok(fs.existsSync(pre), 'pre-existing moved')

        t.end()
      })
    })
  })
})

test('conflict', function(t) {
  createProject(function(err, project) {
    var component = path.join(project, 'comp')
    
    createProject({root: component, underscore: '1.3.3'}, function(err){
      if (err) throw err

      install({cwd: project}, function(){
        testStructure(project, t)
        testStructure(component, t, '1.3.3')
        t.end()
      })
    })
  })  
})

test('normalize up', function(t) {
  createProject(function(err, project) {
    var component = path.join(project, 'comp')
    
    createProject({root: component, underscore: '1.3.3'}, function(err){
      if (err) throw err
      t.plan(2)
      install({cwd: project}, function(){
        t.equal(readPkg(component).dependencies.underscore, '1.3.3')

        var opts = {
          cwd: project, prompt: function(msg, cb) { cb('1.5.1') }
        }

        rnpm.normalize(opts, function(err){
          if (err) throw err
          t.equal(readPkg(component).dependencies.underscore, '1.5.1')
        })
      })
    })
  })  
})

test('normalize down', function(t) {
  createProject(function(err, project) {
    var component = path.join(project, 'comp')
    
    createProject({root: component, underscore: '1.3.3'}, function(err){
      if (err) throw err
      t.plan(2)
      install({cwd: project}, function(){
        t.equal(readPkg(project).dependencies.underscore, '1.5.1')

        var opts = {
          cwd: project, prompt: function(msg, cb) { cb('1.3.3') }
        }

        rnpm.normalize(opts, function(err){
          if (err) throw err
          t.equal(readPkg(project).dependencies.underscore, '1.3.3')
        })
      })
    })
  })  
})

function readPkg(dir, prop) {
  var pkg = path.join(dir, 'package.json')
  try {
    return JSON.parse(fs.readFileSync(pkg, {encoding: 'utf-8'}))
  } catch(e) { return { dependencies: {} } }
}

test('execute', function(t) {
  createProject(function(err, project) {
    var component = path.join(project, 'comp')

    t.plan(4)
    createProject({root: component}, function(err){
      if (err) throw err

      install({cwd: project}, function(){
        t.notOk(fs.existsSync(path.join(project, 'ran-index')), 'no ./ran-index')
        t.notOk(fs.existsSync(path.join(component, 'ran-index')), 'no ./ran-index')

        execute('node', {cwd: project}, ['index.js'], function(err){
          if (err) throw err

          t.ok(fs.existsSync(path.join(project, 'ran-index')), 'ran-index')
          t.ok(fs.existsSync(path.join(component, 'ran-index')), 'ran-index')
        })
      })
    })
  })
})

test('npm test', function(t) {
  createProject(function(err, project) {
    var component = path.join(project, 'comp')

    t.plan(4)
    createProject({root: component}, function(err){
      if (err) throw err

      install({cwd: project}, function(){
        t.notOk(fs.existsSync(path.join(project, 'ran-index')), 'no ./ran-index')
        t.notOk(fs.existsSync(path.join(component, 'ran-index')), 'no ./ran-index')

        rnpm.test({cwd: project}, function(err){
          if (err) throw err

          t.ok(fs.existsSync(path.join(project, 'ran-index')), 'ran-index')
          t.ok(fs.existsSync(path.join(component, 'ran-index')), 'ran-index')
        })
      })
    })
  })
})

test('npm run', function(t) {
  createProject(function(err, project) {
    var component = path.join(project, 'comp')

    t.plan(4)
    createProject({root: component}, function(err){
      if (err) throw err

      install({cwd: project}, function(){
        t.notOk(fs.existsSync(path.join(project, 'ran-index')), 'no ./ran-index')
        t.notOk(fs.existsSync(path.join(component, 'ran-index')), 'no ./ran-index')

        rnpm.run('test', {cwd: project}, function(err){
          if (err) throw err

          t.ok(fs.existsSync(path.join(project, 'ran-index')), 'ran-index')
          t.ok(fs.existsSync(path.join(component, 'ran-index')), 'ran-index')
        })
      })
    })
  })
})

// TODO: postinstall scripts of components will not run, because
// npm install is run in the .rnpm folder (but the script
// is defined in the components's package.json)

// test('postinstall scripts', function(t) {
//   createProject(function(err, project) {
//     var component = path.join(project, 'comp')
    
//     createProject({root: component, underscore: '1.3.3'}, function(err){
//       if (err) throw err

//       install({cwd: project}, function(){
//         t.ok(fs.existsSync(path.join(project, 'ran-postinstall')), 'yes ./ran-postinstall')
//         t.ok(fs.existsSync(path.join(component, 'ran-postinstall')), 'yes ./ran-postinstall')
//         t.end()
//       })
//     })
//   })  
// })

// test('install --ignore-scripts', function(t) {
//   createProject(function(err, project) {
//     var component = path.join(project, 'comp')
    
//     createProject({root: component, underscore: '1.3.3'}, function(err){
//       if (err) throw err

//       install({cwd: project, ignoreScripts: true}, function(){
//         t.notOk(fs.existsSync(path.join(project, 'ran-postinstall')), 'no ./ran-postinstall')
//         t.notOk(fs.existsSync(path.join(component, 'ran-postinstall')), 'no ./ran-postinstall')
//         t.end()
//       })
//     })
//   })  
// })

test('[teardown]', function(t){
  mockServer && mockServer.close()
  t.end()
})

var numProjects = 0
var tpl = require('./fixtures/package_tpl.json')

function createProject(opts, done) {
  if (typeof opts == 'function') done = opts, opts = {}
  
  var root = opts.root
  var pkg  = xtend(tpl, {
    dependencies: {
      "underscore": opts.underscore || '1.5.1'
    }
  })

  numProjects++;

  if (!root) {
    var name = (++numProjects) + '-' + (+new Date)
    root = path.join(tmpdir, 'rnpm-tests', name)
  } else if(!isPathInside(root, tmpdir)) {
    return done(new Error('Outside of tmpdir: '+root))
  }

  mkdirp(root, function(err){
    if (err) return done(err)

    var json = JSON.stringify(pkg, null, ' ')
    var index = "require('fs').writeFile('./ran-index', 'yes');"
    var postinstall = "process.exit(1)//require('fs').writeFile('./ran-postinstall', 'yes');"

    fs.writeFile(path.join(root, 'package.json'), json, function(err){
      if (err) return done(err)

      fs.writeFile(path.join(root, 'index.js'), index, function(err){
        if (err) return done(err)
        fs.writeFile(path.join(root, 'postinstall.js'), postinstall, function(err){
          done(err, root)
        })
      })
    })
  })
}

function testStructure(project, t, underscoreVer) {
  if (!underscoreVer) underscoreVer = '1.5.1'

  var link = path.join(project, 'node_modules')
    , target = path.join(project, '.rnpm/node_modules')
    , testPkg = path.join(link, 'underscore/package.json')

  t.ok(isSymlink(link), 'symlinked node_modules')
  t.equal(fs.realpathSync(link), target, 'to .rnpm/node_modules')

  t.ok(fs.existsSync(path.join(project, '.rnpm/package.json')), 'has .rnpm/package.json')
  t.ok(fs.existsSync(target), 'has .rnpm/node_modules')

  var exists = fs.existsSync(testPkg)
  if (!exists) return t.ok(false, 'underscore installed')

  var underscore = require(testPkg)
  t.equal(underscore.version, underscoreVer, 'underscore@'+underscoreVer+' installed')
}

function isSymlink(link) {
  if (!fs.existsSync(link)) return false
  var stats = fs.lstatSync(link)
  return stats.isSymbolicLink()
}
