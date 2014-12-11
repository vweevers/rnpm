var commander = require('commander')
  , analyze = require('./analyze')
  , updateDep = require('./update-dep')
  , log = require('./util/log')
  , assertOptions = require('./util/assert-options')
  , cliPrompt = require('cli-prompt')
  , format = require('util').format

module.exports = function(options, callback) {
  assertOptions(options)
  
  var cwd = options.cwd
  var prompt = options.prompt || cliPrompt

  // analyze dependencies
  analyze({ silent: true, cwd: cwd }, normalize);

  // normalize all dependencies
  function normalize(depsPerDir, inconsistencies) {
    var deps = Object.keys(inconsistencies);

    // normalize each dependency
    function normalizeOne(i) {

      // we've reached the end of the dependency list
      if (i >= deps.length) {
        log('normalize', 'Done.')
        return callback && callback();
      }

      // ask the user for the right version
      var msg = format(
        '(%d/%d) New version for `%s` [ %s ]: ', 
        i+1, deps.length, deps[i],
        inconsistencies[deps[i]].sort().join(', ')
      )

      prompt(msg, function(version) {
        if (!version) {
          log('normalize', 'Skipping dependency `' + deps[i] + '`.');
          return normalizeOne(i+1);
        }
        updateDep({ dependency: deps[i], version: version, cwd: cwd }, function() {
          normalizeOne(i+1);
        })
      })
    }

    if (deps.length > 0) {
      if (deps.length == 1) {
        log('normalize', '1 dependency needs normalization.')
      } else {
        log('normalize', deps.length + ' dependencies need normalization.')
      }
      log('normalize', '(Leave a dependency empty to skip it.)')
      normalizeOne(0);
    } else {
      log('normalize', 'All dependencies already normalized.')
      callback && callback();
    }
  }
}
