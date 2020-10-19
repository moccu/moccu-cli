import yargs from 'yargs';

import {deploy, migrateDb, downloadDb, dumpDb, restoreDb, release, runShell, shutdown} from './commands';
import {configuration} from './configuration';


const
	COMMAND_INSTANCE = (config) => {
		return {
			describe: 'the instance for deployment',
			type: 'string',
			choices: Object.keys(config.deployment.instances)
		};
	}
;

export function cli() {
	const
		config = configuration(),
		args = yargs
			.usage('Usage: $0 <command> [options]')
			.command('deploy <instance>', 'Deploy tag to instance', (yargs) => {
				yargs.option('migrate', {alias: 'm', description: 'Run migration after deployment', type: 'boolean'});
				yargs.option('tag', {alias: 't', description: 'Deploy specific tag', type: 'string'});
				yargs.positional('instance', COMMAND_INSTANCE(config));
			})
			.command('downloaddb <instance>', 'Download Database from given instance', (yargs) => {
				yargs.positional('instance', COMMAND_INSTANCE(config));
			})
			.command('dumpdb <instance>', 'Dump Database for given instance', (yargs) => {
				yargs.positional('instance', COMMAND_INSTANCE(config));
			})
			.command('migrate <instance>', 'Migrate Database for given instance', (yargs) => {
				yargs.positional('instance', COMMAND_INSTANCE(config));
			})
			.command('release', 'Add and push a new tag to remote branch')
			.command('restoredb <instance>', 'Restore Database for given instance', (yargs) => {
				yargs.positional('instance', COMMAND_INSTANCE(config));
			})
			.command('shell <instance>', 'Start shell on given instance', (yargs) => {
				yargs.positional('instance', COMMAND_INSTANCE(config));
			})
			.command('shutdown <instance>', 'Shutdown container on given instance', (yargs) => {
				yargs.option('remove', {alias: 'rm', description: 'Remove container after shutdown', type: 'boolean'});
				yargs.positional('instance', COMMAND_INSTANCE(config));
			})
			.example([
				['$0 release', 'Add and push a new tag to remote branch']
			])
			.recommendCommands()
			.scriptName('moccu-cli')
			.showHelpOnFail(true)
			.demandCommand(1, '')
			.help()
			.alias('help', 'h')
			.strict()
			.argv,
		cmd = args._[0] || 'help'
	;

	if (args.instance) {
		global.instance = args.instance;
		global.config = {...config.deployment.common, ...config.deployment.instances[args.instance]};
	}

	switch (cmd) {
		case 'deploy':
			deploy(args);
			break;
		case 'migrate':
			migrateDb();
			break;
		case 'release':
			release();
			break;
		case 'dumpdb':
			dumpDb();
			break;
		case 'restoredb':
			restoreDb();
			break;
		case 'downloaddb':
			downloadDb();
			break;
		case 'shell':
			runShell();
			break;
		case 'shutdown':
			shutdown();
			break;
	}
}
