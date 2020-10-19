import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import shelljs from 'shelljs';

import {migrate as migrateDb} from './database';
import {getDeployedTag, getDockerImageName, getLatestTag, dockerCompose} from '../utils';


export function deploy({migrate = false, tag = null}) {
	getDeployedTag(async (deployedTag) => {
		const
			{host} = global.config,
			cwd = process.cwd(),
			dockerfile = path.join(cwd, 'deployment', 'Dockerfile.nginx'),
			releaseTag = tag || await getLatestTag(),
			{deployConfirm} = await inquirer.prompt({
				type: 'confirm',
				name: 'deployConfirm',
				message: `Update from ${chalk.yellow(deployedTag)} to ${chalk.yellow(releaseTag)} on ${chalk.yellow(host)}?`,
				default: false
			})
		;

		if (deployConfirm) {
			let
				spinner = ora({text: 'Rebuild nginx container', color: 'cyan'}).start()
			;

			shelljs.exec(`DOCKER_HOST=ssh://${host} docker build -t ${getDockerImageName('nginx', global.instance)} -f ${dockerfile} deployment`, {silent: true}, (code, stdout, stderr) => {
				if (code !== 0) {
					spinner.fail(stderr);
					return process.exit();
				}

				spinner.succeed('Rebuild successfully completed');
				spinner = ora({text: `Deploy new release with tag ${chalk.yellow(releaseTag)}`, color: 'cyan'}).start();

				dockerCompose('up -d', (code, stdout, stderr) => {
					if (code === 0) {
						spinner.succeed(`New Release ${chalk.yellow(releaseTag)} successful deployed on ${chalk.yellow(host)}`);

						if (migrate) {
							migrateDb();
						}
					} else {
						spinner.fail(stderr);
						return process.exit();
					}
				}, releaseTag);
			});
		} else {
			console.log(chalk.red('Deployment cancelled!'));
			return process.exit();
		}
	});
}
