rnpm - recursive npm
====================

`rnpm` is a wrapper around `npm` to allow the installation of dependencies declared in multiple `package.json` files nested into a project structure. This is useful for large projects that are composed of multiple independent *components*.

## `rnpm install`

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

Here we have two components: `login` and `settings`, each with its own `package.json`. When you run `rnpm install`, rnpm will traverse the tree to collect the dependencies listed in each `package.json`. It will then install each dependency at the project root:

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

If two or more components depend on different versions of the same module, rnpm will issue a warning, and install one version at the root, and the other version(s) at `[component]/node_modules`.

For your convenience and npm compatibility, `install` is aliased as `i`.

## `rnpm analyze`

Check for conflicting dependency versions and show warnings, without installing anything.

## `rnpm update-dep`

Recursively update a dependency version across multiple `package.json` files. It accepts the following syntax:

    $ rnpm update-dep <dependency> <version>

*Note: this only updates the version number in the `package.json`, it does not install anything.*

## `rnpm normalize`

Check for conflicting dependency versions, and prompt for the correct version on each inconsistency found. It's equivalent to calling `rnpm analyze` and then `rnpm update-dep` manually (but much faster).

## `rnpm list [--depth=n]`

Run `npm list` for every component (including root). Aliased as `ls`.

## `rnpm prune [--production]`

Run `npm prune` for every component (including root). Additionally, this command will remove the `.rnpm` and `node_modules` folders from components without overriding dependencies.

## `rnpm shrinkwrap`

Shrinkwrap all the components.

## `rnpm execute -- [command]`

Execute an arbitrary command in every component (including root). Note the two dashes, they signify the end of arguments parsing - the rest is passed to `child_process.spawn()`. Aliased as `exec`. An example:

`$ rnpm exec -- ls -A`
