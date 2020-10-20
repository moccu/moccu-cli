import chalk from 'chalk';
import ora from 'ora';
import dayjs from 'dayjs';
import inquirer from 'inquirer';
import path from 'path';
import shelljs from 'shelljs';

import {getContainerId, getDockerProjectName} from '../utils';


function selectDump(dockerProjectName, onSuccess) {
	const
		{host} = global.config,
		folder = path.join('/dumps', dockerProjectName),
		spinner = ora({text: 'Search for dumps', color: 'cyan'}).start()
	;

	shelljs.exec(`ssh ${host} ls -la ${folder} | awk '{print $5, $9}' | tail -5`, {silent: true}, async (code, stdout) => {
		const
			dumps = stdout.split('\n').filter((name) => name !== '').sort().reverse().map((file) => {
				const
					[size, name] = file.split(' ')
				;

				return {name, size};
			})
		;

		spinner.stop();
		console.log('Available dumps:');

		const
			{filename} = await inquirer.prompt({
				type: 'list',
				name: 'filename',
				message: `Which one do you want to use?`,
				choices: dumps.map(({name}) => name)
			})
		;

		onSuccess(dumps.find((file) => file.name === filename));
	});
}

export function migrate() {
	const
		{host} = global.config
	;

	getContainerId('server', (containerId) => {
		const
			spinner = ora({text: 'Migrate database', color: 'cyan'}).start()
		;

		shelljs.exec(`DOCKER_HOST=ssh://${host} docker exec ${containerId} npm run migrate`, {silent: true}, (code, stdout, stderr) => {
			if (code === 1) {
				spinner.fail(stderr);
			} else if (stdout.includes('No migrations were executed, database schema was already up to date')) {
				spinner.fail('No migrations were executed, database schema was already up to date');
			} else {
				spinner.succeed('Migration completed');
			}
		});
	});
}

export function dump() {
	const
		{host} = global.config,
		dockerProjectName = getDockerProjectName(),
		folder = path.join('/dumps', dockerProjectName),
		filename = `${dayjs().format('YYYYMMDD-HHmmss')}.sql`,
		filePath = path.join(folder, filename),
		command = 'pg_dump -U postgres postgres'
	;

	getContainerId('postgres', (containerId) => {
		const
			spinner = ora({text: 'Dump database', color: 'cyan'}).start()
		;

		shelljs.exec(`ssh ${host} 'sh -c "mkdir -p ${folder} && docker exec -i ${containerId} ${command} | gzip > ${filePath}"'`, {silent: true}, (code, stdout, stderr) => {
			if (code === 0) {
				spinner.succeed('Dump created');
			} else {
				spinner.fail(stderr);
			}
		});
	});
}

export function restore() {
	const
		{host} = global.config,
		dockerProjectName = getDockerProjectName()
	;

	selectDump(dockerProjectName, async (file) => {
		const
			{restoreConfirm} = await inquirer.prompt({
				type: 'confirm',
				name: 'restoreConfirm',
				message: `The whole database will be overwritten with ${chalk.yellow(file.name)}`,
				default: false
			})
		;

		if (restoreConfirm) {
			const
				folder = path.join('/dumps', dockerProjectName),
				filePath = path.join(folder, file.name),
				command = 'psql -U postgres postgres'
			;

			getContainerId('postgres', (containerId) => {
				const
					spinner = ora({text: `Restore database with dump ${chalk.yellow(file.name)}`, color: 'cyan'}).start()
				;

				shelljs.exec(`DOCKER_HOST=ssh://${host} docker exec ${containerId} dropdb -U postgres postgres`, {silent: true}, (code, stdout, stderr) => {
					if (code !== 0) {
						spinner.fail(stderr);
						return process.exit();
					}

					shelljs.exec(`DOCKER_HOST=ssh://${host} docker exec ${containerId} createdb -U postgres postgres`, {silent: true}, (code, stdout, stderr) => {
						if (code !== 0) {
							spinner.fail(stderr);
							return process.exit();
						}

						shelljs.exec(`ssh ${host} 'sh -c "gzip -cd ${filePath} | docker exec -i ${containerId} ${command}"'`, {silent: true}, (code, stdout, stderr) => {
							if (code !== 0) {
								spinner.fail(stderr);
								return process.exit();
							}

							spinner.succeed('Dump successfully restored');
						});
					});
				});
			});
		} else {
			console.log(chalk.red('Restore cancelled!'));
			return process.exit();
		}
	});
}

export function download() {
	const
		{host} = global.config,
		dockerProjectName = getDockerProjectName(),
		folder = path.join('dumps', dockerProjectName)
	;

	selectDump(dockerProjectName, (file) => {
		const
			filePath = path.join(folder, file.name),
			spinner = ora({text: 'Download dump', color: 'cyan'}).start()
		;

		shelljs.exec(`scp ${host}:/${filePath} ${folder}`, {silent: true}, (code, stdout, stderr) => {
			if (code === 0) {
				spinner.succeed(`Dump was successfully downloaded: ${process.cwd()}/${filePath}`);
			} else {
				spinner.fail(stderr);
			}
		});
	});
}
