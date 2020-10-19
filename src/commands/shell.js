import chalk from 'chalk';

import {getContainerId} from '../utils';


export function runShell() {
	const
		{host} = global.config
	;

	getContainerId('server', (containerId) => {
		console.log(`Server:\t\t${chalk.yellow(`DOCKER_HOST=ssh://${host} docker exec -it ${containerId} ash`)}`);
	});

	getContainerId('postgres', (containerId) => {
		console.log(`Database:\t${chalk.yellow(`DOCKER_HOST=ssh://${host} docker exec -it ${containerId} bash`)}`);
	});
}
