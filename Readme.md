# rnpm - recursive npm

`rnpm` wraps npm 3 to work with dependencies and scripts declared in multiple `package.json` files nested into a project structure. This is useful for *monorepo's*: large projects composed of multiple related (yet independent) packages.

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

Here we have three packages: `login`, `settings` and the root. The `rnpm install` command collects the dependencies listed in each `package.json`. It then installs each dependency at the root:

    lib/
      login/
      settings/
    node_modules/
      login-dependency/
      settings-dependency/
      root-dependency/

We call these *consolidated dependencies*.

**Version conflicts**

If however, two or more packages depend on different versions of the same module, rnpm will issue a warning and install one version at the root, and the other version(s) at `[package]/node_modules`.

    lib/
      login/
        node_modules/
          conflicting-dependency/
    node_modules/
      conflicting-dependency/

**Symlinks**

Each package is also symlinked to `node_modules/[package]`. If that name is taken, rnpm will issue a warning.

    lib/
      login/
      settings/
    node_modules/
      login/ -> lib/login/
      settings/ -> lib/settings/

Now you can `require('login')` anywhere in your project, instead of the cumbersome `require('../../../lib/login')`.

**Alias**

For your convenience and npm compatibility, `install` is aliased as `i`.

## `rnpm analyze [--production]`

Find conflicting dependency versions, without installing anything.

## `rnpm update-dep <dependency> <version>`

Update a dependency version (or semver range) across all packages.

*Note: this only updates the version number in the `package.json`, it does not install anything.*

## `rnpm normalize`

Check for conflicting dependency versions, and prompt for the correct version on each inconsistency found. It's equivalent to calling `rnpm analyze` and then `rnpm update-dep` manually (but much faster).

## `rnpm update [--production] [--ignore-scripts]`

`npm update` all packages. Aliased as `u`.

## `rnpm version [major | minor | patch]`

Like `npm version`, but for all packages. Updates the version number of each package, as well as internal dependencies (sets dependency to `~x.x.x` in `dependencies` and / or `devDependencies` of a `package.json`), then runs `npm version` on the root. Without any arguments, `rnpm version` prints the current version. Note: `rnpm version x.x.x` is not yet supported.

## `rnpm rebuild [--production]`

`npm rebuild` all packages.

## `rnpm run [script]`

Run a script with `npm run` in every package (including root). If no `script` argument is provided, it will list available scripts.

## `rnpm test`

Run `npm test` in every package (including root). Aliased as `t`. You could also do `rnpm run test` but like npm, `rnpm test` is more forgiving towards errors. Errors will be logged but will not prevent the next package from being tested.

## `rnpm list [--depth=n]`

Run `npm list` for every package (including root). Aliased as `ls`. Note, this will list the consolidated dependencies, not necessarily the ones listed in the `package.json` files.

## `rnpm prune [--production]`

Run `npm prune` for every package (including root). Additionally, this command will remove the `.rnpm` and `node_modules` folders from packages that have no overriding dependencies.

## `rnpm shrinkwrap`

Shrinkwrap all packages. Aliased as `shrink`. Differences from `npm shrinkwrap`:

- `--dev` option is not supported
- does not warn about excluded devDependencies and extraneous packages
- ignores (but warns about) other problems

## `rnpm execute -- <command>`

Execute an arbitrary command in every package (including root). Note the two dashes, they signify the end of arguments parsing - the rest is passed to `child_process.spawn()`. Aliased as `exec`.

An example, creating [browserify](https://github.com/substack/node-browserify) bundles for all packages:

`$ rnpm exec -- browserify index.js > bundle.js`

You could also make this a script in your root `package.json` so you can `npm run build`.

```json
"scripts": {
  "build": "rnpm exec -- browserify index.js > bundle.js"
}
```

## todo

- readme TOC
- silent flag
- run arguments
- `rnpm exec "command" | whatever`
- `rnpm exec "command" [package-glob]`
- `rnpm test | multi-tap`
- `rnpm test [package-glob]`
- `rnpm install [dep] [--to package-glob]`
- `rnpm save [dep] [--to package-glob]`
- `rnpm [cd | pushd | popd] [package-glob]`
- `rnpm symlink` (like install would)
- `rnpm link [--from package-glob]`
- `rnpm link [global dep] [--to package-glob]`
- `rnpm packages [--json]`
- `rnpm pack`
- `rnpm publish`
- `rnpm create` or `rnpm nom`
