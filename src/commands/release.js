import chalk from 'chalk';
import inquirer from 'inquirer';
import simpleGit from 'simple-git';

import {getLatestTag, getNextTag, pushTag} from '../utils';


const
	QUESTIONS = {
		release: () => {
			return {
				type: 'input',
				name: 'release',
				message: 'Please enter the type of release [m]ajor, [f]eature, [b]uild',
				validate: (value) => {
					if ((/^[mfbMFB]{1}$/).test(value)) {
						return true;
					}

					return 'Please enter the type of release [m]ajor, [f]eature, [b]uild';
				}
			};
		},
		pushTag: (version) => {
			return {
				type: 'confirm',
				name: 'pushConfirm',
				message: `Release and push version ${chalk.yellow(version)}?`,
				default: false
			};
		}
	}
;

export async function release() {
	const
		git = simpleGit(),
		{ahead, current} = await git.status(),
		tag = await getLatestTag(),
		splittedTag = tag.split('.')
	;

	let nextTag, msg;

	if (ahead > 0){
		console.log(chalk.red('Current HEAD is not pushed to remote'));
		return process.exit();
	}

	if (current === 'master') {
		const
			{release} = await inquirer.prompt(QUESTIONS.release()),
			pos = ['m', 'f', 'b'].indexOf(release[0].toLowerCase())
		;

		nextTag = getNextTag(tag, pos);
		msg = ['major', 'feature', 'build'][pos];
	} else {
		nextTag = getNextTag(tag);
		msg = splittedTag[0] === 'develop' ? 'develop branch' : 'feature branch';
	}

	const {pushConfirm} = await inquirer.prompt(QUESTIONS.pushTag(nextTag));

	if (pushConfirm) {
		await pushTag(nextTag, msg);
	} else {
		console.log(chalk.red('Release cancelled!'));
		return process.exit();
	}
}
