var fs = require('fs')
  , path = require('path')
  , os = require('os')
  , log = require('./log')

// Use junctions on Windows < Vista (6.0),
// Vista and later support regular symlinks.
if (os.platform()=='win32' && parseInt(os.release())<6) {
  var symlinkType = 'junction'
} else {
  symlinkType = 'dir'
}

exports.linkComponents = linkComponents
exports.unlinkComponents = unlinkComponents
exports.symlink = symlink

// TODO: make async.
function linkComponents(cwd, components, done) {
  // symlink each component to node_modules/[name], if free
  components.forEach(function (dir) {
    if (dir=='.') return

    var name = componentName(cwd, dir)
    if (!name) return

    var link = path.join(cwd, '.rnpm/node_modules', name)
    var target = path.join(cwd, dir)

    if (fs.existsSync(link)) {
      var real = fs.realpathSync(link)
      if (real===target) return
      log.warn('symlink', dir+': symlink name taken by "'+real+'"')
    } else {
      var relative = path.relative(path.dirname(link), target)
      // log('symlink', dir+': symlinking "'+link+'" to "'+relative+'"')
      symlink(relative, link)
    }
  })

  return done()
}

// TODO: make async.
function unlinkComponents(cwd, components, done) {
  components.forEach(function (dir) {
    if (dir=='.') return

    var name = componentName(cwd, dir)
    if (!name) return

    var link = path.join(cwd, '.rnpm/node_modules', name)
    var target = path.join(cwd, dir)

    if (fs.existsSync(link) && fs.realpathSync(link)===target) {
      // log('symlink', dir+': unlinking "'+link+'"')
      fs.unlinkSync(link)
    }
  })

  done()
}

function componentName(cwd, dir) {
  var pkg = path.join(cwd, dir, 'package.json')
  var name = require(pkg).name
  if (!name) log.warn('symlink', dir+': missing package name')
  return name
}

function symlink(target, link) {
  // Junction points must be absolute
  if (symlinkType=='junction') {
    target = path.resolve(link, '..', target)
  }

  fs.symlinkSync(target, link, symlinkType)
}
