rnpm - recursive npm
====================

`rnpm` is a wrapper around `npm` to allow the installation of dependencies declared in multiple `package.json` files nested into a project structure. This is useful for large projects that are composed of multiple independent *components*.

## `rnpm install [--production] [--ignore-scripts]`

Suppose you have the following directory structure:

    lib/
      login/
        index.js
        package.json
      settings/
        index.js
        package.json
    main.js
    package.json

Here we have two components: `login` and `settings`, each with its own `package.json`. When you run `rnpm install`, rnpm will collect the dependencies listed in each `package.json`. It will then install each dependency at the project root:

    lib/
      login/
        index.js
        package.json
      settings/
        index.js
        package.json
    node_modules/
      a-login-dependency/
      a-settings-dependency/
      a-root-dependency/
    main.js
    package.json

**Version conflicts**

If two or more components depend on different versions of the same module, rnpm will issue a warning, and install one version at the root, and the other version(s) at `[component]/node_modules`.

**Symlinks**

Each component is also symlinked to `node_modules/name`, where `name` is the package name. If that name is taken, rnpm will issue a warning.

```js
// Now you can do this, anywhere in your project:
var loginComponent = require('login')

// Instead of:
var loginComponent = require('../../../lib/login')
```

**Alias**

For your convenience and npm compatibility, `install` is aliased as `i`.

## `rnpm analyze [--production]`

Find conflicting dependency versions, without installing anything.

## `rnpm update-dep`

Recursively update a dependency version across multiple `package.json` files. It accepts the following syntax:

    $ rnpm update-dep <dependency> <version>

*Note: this only updates the version number in the `package.json`, it does not install anything.*

## `rnpm normalize`

Check for conflicting dependency versions, and prompt for the correct version on each inconsistency found. It's equivalent to calling `rnpm analyze` and then `rnpm update-dep` manually (but much faster).

## `rnpm update [--production] [--ignore-scripts]`

`npm update` all the components. Aliased as `u`.

## `rnpm rebuild [--production]`

`npm rebuild` all the components.

## `rnpm run [script]`

Run a script with `npm run` for every component (including root). If no `script` argument is provided, it will list available scripts.

## `rnpm test`

Run `npm test` for every component (including root). Aliased as `t`. You could also do `rnpm run test` but like npm, `rnpm test` is more forgiving towards errors. Errors will be logged but will not prevent the next component from being tested.

## `rnpm list [--depth=n]`

Run `npm list` for every component (including root). Aliased as `ls`. Note, this will list the consolidated dependencies, not necessarily the ones listed in the `package.json` files.

## `rnpm prune [--production]`

Run `npm prune` for every component (including root). Additionally, this command will remove the `.rnpm` and `node_modules` folders from components that have no overriding dependencies.

## `rnpm shrinkwrap`

Shrinkwrap all the components. Aliased as `shrink`. Differences from `npm shrinkwrap`:

- `--dev` option is not supported
- does not warn about excluded devDependencies and extraneous packages
- ignores (but warns about) other problems

## `rnpm execute -- <command>`

Execute an arbitrary command in every component (including root). Note the two dashes, they signify the end of arguments parsing - the rest is passed to `child_process.spawn()`. Aliased as `exec`.

An example, creating [browserify](https://github.com/substack/node-browserify) bundles for all components:

`$ rnpm exec -- browserify index.js > component_bundle.js`
