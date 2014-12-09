RNPM - Recursive NPM
====================

`rnpm` is a wrapper around `npm` to allow the installation of dependencies declared in multiple `package.json` files nested into a project structure. This is useful for large projects that are composed of multiple independent components.

## `rnpm install`

Suppose you have the following hypothetical directory structure:

    project/
      lib/
        login-screen/
          login-screen.js
          login-screen.jade
          package.json
        setting-screen/
          settings-screen.js
          settings-screen.jade
          package.json
        [...]
      main.js
      package.json

When you run `rnpm install`, RNPM will dive into the project subdirectories and find all the dependencies listed in each `package.json` file. It will then install each one at the project root:

    project/
      lib/
        login-screen/
          login-screen.js
          login-screen.jade
          package.json
        setting-screen/
          settings-screen.js
          settings-screen.jade
          package.json
        [...]
      node_modules/
        foo/
          [...]
        bar/
          [...]
        dead/
          [...]
        cafe/
          [...]
      main.js
      package.json

For your convenience and npm compatibility, `install` is aliased as `i`.

### Version Conflicts

If different versions of the same lib are listed in two or more `package.json` files, RNPM will issue a warning, and install one version at the project root, and the other version(s) under the right directories.

## `rnpm analyze`

When you run `rnpm analyze`, RNPM will check for conflicting dependency versions and warn you about them, without installing anything.

## `rnpm update-dep`

The `update-dep` command allows you to recursively update a dependency version across multiple `package.json` files. It accepts the following syntax:

    $ rnpm update-dep <dependency> <version>

## `rnpm normalize`

The `normalize` command will check for conflicting dependency versions, and prompt you for the correct version on each inconsistency found. It's equivalent to calling `rnpm analyze` and then `rnpm update-dep` manually (but much faster).

## `rnpm list [--depth=n]`

Run `npm list` in every subdirectory with a `package.json`. Aliased as `ls`.

## `rnpm prune [--production]`

Run `npm prune` in every subdirectory with a `package.json`. Additionally, this command will remove the `.rnpm` and `node_modules` folders from subdirectories if those directories have no overriding dependencies.

## `rnpm shrinkwrap`

Shrinkwrap all the subdirectories with a `package.json`.
