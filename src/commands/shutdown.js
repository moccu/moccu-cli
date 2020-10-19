import ora from 'ora';

import {dockerCompose} from '../utils';


export function shutdown(remove=false) {
	let
		spinner = ora({text: 'Stop container', color: 'cyan'}).start()
	;

	dockerCompose('stop', (code, stdout, stderr) => {
		if (code === 0) {
			spinner.succeed('Container successfully stopped');

			if (remove) {
				spinner = ora({text: 'Remove container', color: 'cyan'}).start();

				dockerCompose('rm -v', (code, stdout, stderr) => {
					if (code === 0) {
						spinner.succeed('Container successfully removed');
					} else {
						spinner.fail(stderr);
					}
				});
			}
		} else {
			spinner.fail(stderr);
		}
	});
}
