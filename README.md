moccu-cli
==============


CLI to run commands for docker

## Installation and Usage

You can install the moccu-cli using npm:
```
$ npm install -g moccu-cli
```
You should then set up a configuration file:
```
{
	"deployment": {
		"common": {
			"client": "clientname",
			"project": "projectname",
			"compose": {
				"nodeCommand": "\"node server.js\""
			}
		},
		"instances": {
			"localhost": {
				"host": "localhost",
				"stage": "testing",
				"compose": {
					"envFile": "localhost.env"
				}
			},
			"testing": {
				"server": "testing",
				"host": "testing.moccu.net",
				"stage": "testing",
				"compose": {
					"envFile": "testing.env"
				}
			},
			"live": {
				"server": "live",
				"host": "live.moccu.net",
				"stage": "live",
				"compose": {
					"envFile": "live.env"
				}
			}
		}
	}
}
```
All key-value-pairs inside `compose` would be converted to uppcased snakecase-string and will be used as environment variable for docker-compose.
Example:
- `nodeCommand` => `COMPOSE_NODE_COMMAND`
- `envFile` => `COMPOSE_ENV_FILE`


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
