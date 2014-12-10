var fs = require('fs')
  , path = require('path')
  , npm = require('npm')
  , analyze = require('./analyze')
  , util = require('./util')
  , os = require('os')

// Use junctions on Windows < Vista (6.0),
// Vista and later support regular symlinks.
if (os.platform()=='win32' && parseInt(os.release())<6) {
  var symlinkType = 'junction'
} else {
  symlinkType = 'dir'
}

module.exports = function install(options, callback) {

  var cwd = process.cwd()

  // Initialize NPM as a lib
  npm.load({}, function() {

    // analyze dependencies
    analyze(options, install)

    // install everything
    function install(depsPerDir, inconsistencies) {

      if (options.strict && Object.keys(inconsistencies).length > 0) {
        util.error('strict mode', 'Failing because of inconsistent dependencies.')
        process.exit(-1);
      }

      var dirs = Object.keys(depsPerDir)

      // install each directory with dependencies
      function installDir(i) {
        if (i >= dirs.length) {
          util.log('install', 'Done.');
          return callback && callback()
        }

        var dir = dirs[i]

        util.log('install', dir)

        // Create the directory structure we need if it's not already in place
        var dotrnpm = path.join(cwd, dir, '.rnpm')
        var link = path.join(cwd, dir, 'node_modules')

        if (!fs.existsSync(dotrnpm)) {
          fs.mkdirSync(dotrnpm);
        
          var target = path.join(dotrnpm, 'node_modules') 

          if (fs.existsSync(link)) {
            util.warn('install', 'Moving existing node_modules to .rnpm')
            fs.renameSync(link, target)
          } else {
            fs.mkdirSync(target);
          }
          
          symlink('.rnpm/node_modules', link);

          // avoid npm warning, and provide some info
          // on the nature of the `.rnpm` dir
          fs.writeFileSync(path.join(dotrnpm, 'Readme.md'),
                           'This is a special directory created by ' +
                           '`rnpm` to consolidate the project deps.\n',
                           'utf-8');
        } else {
          if (!fs.existsSync(link)) {
            symlink('.rnpm/node_modules', link);
          }
        }

        // write deps to `.rnpm/package.json`
        var dependencies = {}, devDependencies = {};

        for (var dep in depsPerDir[dir]) {
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
        fs.writeFileSync(path.join(dotrnpm, 'package.json'),
                         JSON.stringify(pkgJson, null, '  ') + '\n',
                         'utf-8');

        // install deps inside the `.rpnm` directory
        npm.prefix = dotrnpm;
        npm.config.set('production', !!options.production);
        npm.commands.install([], function(err) {
          if (err) throw err;
          installDir(i+1)
        })
      }
      installDir(0)
    }
  })
}

function symlink(target, link) {
  // Junction points must be absolute
  if (symlinkType=='junction') {
    target = path.resolve(link, '..', target)
  }

  fs.symlinkSync(target, link, symlinkType)
}
