moccu-cli
==============

[![Coverage Status](https://coveralls.io/repos/github/evanshortiss/lintspaces-cli/badge.svg?branch=master)](https://coveralls.io/github/moccu/moccu-cli?branch=master)
[![npm version](https://badge.fury.io/js/lintspaces-cli.svg)](https://www.npmjs.com/package/@moccu/moccu-cli)


CLI to run commands for docker

## Install
```
$ npm install -g moccu-cli
```


## Alias
```
moccu
```


## Help Output

```
$ moccu-cli ---help
Usage: moccu-cli <command> [options]

Commands:
  moccu-cli deploy <instance>      Deploy tag to instance
  moccu-cli downloaddb <instance>  Download Database from given instance
  moccu-cli dumpdb <instance>      Dump Database for given instance
  moccu-cli migrate <instance>     Migrate Database for given instance
  moccu-cli release                Add and push a new tag to remote branch
  moccu-cli restoredb <instance>   Restore Database for given instance
  moccu-cli shell <instance>       Start shell on given instance
  moccu-cli shutdown <instance>    Shutdown container on given instance

Options:
  --version  Show version number                                       [boolean]

Examples:
  moccu-cli release  Add and push a new tag to remote branch
```


## Example Commands

Deploy latest tag to instance:

```
moccu-cli deploy live
```

Deploy specific tag to instance:

```
moccu-cli deploy live --tag 0.0.1
```

Create and push new tag to github:

```
moccu-cli release
```


## License

[LICENSE](https://github.com/moccu/moccu-cli/blob/master/LICENSE.md)
