import chalk from 'chalk';
import {snakeCase} from 'change-case';
import ora from 'ora';
import path from 'path';
import simpleGit from 'simple-git';
import shelljs from 'shelljs';


export function getDeployedTag(onSuccess, service = 'server') {
	const
		{host} = global.config,
		dockerProjectName = getDockerProjectName(),
		labels = [
			`com.docker.compose.project=${dockerProjectName}`,
			`com.docker.compose.service=${service}`
		],
		filters = labels.map((label) => `--filter "label=${label}"`).join(' '),
		spinner = ora({text: 'Search for deployed tag', color: 'cyan'}).start()
	;

	shelljs.exec(`DOCKER_HOST=ssh://${host} docker ps ${filters} --format "{{.Image}}"`, {silent: true}, (code, stdout) => {
		let
			deployedTag = 'nothing'
		;

		if (stdout) {
			deployedTag = stdout.split(':')[1].trim();
		}

		spinner.succeed(`Current deployed tag is: ${chalk.yellow(deployedTag)}`);

		onSuccess(deployedTag);
	});
}

export async function getLatestTag(currentBranch) {
	const
		git = simpleGit(),
		spinner = ora({text: 'Search for latest tag', color: 'cyan'}).start()
	;

	let
		tagData
	;

	try {
		const
			{current} = await git.status()
		;

		tagData = await git.listRemote(['--tags'])
		currentBranch = currentBranch || current;
	} catch {
		spinner.fail('An error occured, while fetching git status and remote tags. Please check your git repository');
		return process.exit();
	}

	let
		latestTag,
		re
	;

	if (['main', 'master'].includes(currentBranch)) {
		re = new RegExp(/\d+\.\d+\.\d+/, 'g');
		latestTag = (tagData.match(re) || []).pop();
		latestTag = latestTag || '0.0.0';
	} else {
		const
			regex = new RegExp(/([\W_]+)/, 'g'),
			cleanedBranchName = currentBranch.replace(regex, '-')
		;

		re = new RegExp(`${cleanedBranchName}\\.\\d+`, 'g');
		latestTag = (tagData.match(re) || []).pop();
		latestTag = latestTag || `${cleanedBranchName}.000`;
	}

	spinner.succeed(`Latest tag is: ${chalk.yellow(latestTag)}`);

	return latestTag;
}

export function getNextTag(tag, pos) {
	if ((/\d+\.\d+\.\d+/).test(tag)) {
		return tag
			.split('.')
			.map((n, i) => {
				let number = parseInt(n, 10);

				if (i === pos) {
					return ++number;
				} else if (i > pos) {
					return 0;
				}

				return number;
			})
			.join('.');
	} else {
		let
			splittedTag = tag.split('.'),
			newTag = parseInt(splittedTag[1], 10)
		;

		++newTag;

		return `${splittedTag[0]}.${String(newTag).padStart(3, '0')}`;
	}
}

export async function pushTag(tag, type) {
	const
		git = simpleGit(),
		msg = `Generated ${type} release: ${tag}`
	;

	let
		spinner = ora({text: 'Add new tag', color: 'cyan'}).start()
	;

	try {
		await git.addAnnotatedTag(tag, msg);
	} catch {
		spinner.fail('An error occured, while adding new tag. Please check your git repository');
		return process.exit()
	}

	spinner.succeed('New tag successfully added');
	spinner = ora({text: 'Push new tag to remote', color: 'cyan'}).start();

	try {
		await git.pushTags('origin');
	} catch {
		spinner.fail('An error occured, while pushing new tag to remote repository. Please check your git repository');
		return process.exit()
	}

	spinner.succeed('New tag successfully pushed');
}

export function getDockerProjectName() {
	const
		{client, project, stage} = global.config
	;

	return `${client}${project}${stage}`;
}

export function getDockerImageName(extraLabel = '', version='latest') {
	const
		{client, project} = global.config
	;

	return `${client}-${project}${extraLabel && `-${extraLabel}`}:${version}`;
}

export function getContainerId(service, onSuccess) {
	const
		{host} = global.config,
		dockerProjectName = getDockerProjectName(),
		labels = [
			`com.docker.compose.project=${dockerProjectName}`,
			`com.docker.compose.service=${service}`
		],
		filters = labels.map((label) => `--filter "label=${label}"`).join(' '),
		spinner = ora({text: 'Search for container-id', color: 'cyan'}).start()
	;

	shelljs.exec(`DOCKER_HOST=ssh://${host} docker ps ${filters} --format "{{.ID}}"`, {silent: true}, (code, stdout) => {
		const
			containers = stdout.split('\n').filter((container) => container !== ''),
			containersCount = containers.length
		;

		if (containersCount !== 1) {
			spinner.fail('No or multiple containers found');
			return process.exit();
		}

		spinner.succeed(`Container with ID ${chalk.yellow(containers[0])} found`);

		onSuccess(containers[0]);
	});
}

export function dockerCompose(command, callback, tag = null) {
	const
		{client, compose, host, project, stage} = global.config,
		cwd = process.cwd(),
		composeFile = path.join(cwd, 'deployment', 'docker-compose.yml'),
		onHandleTag = (releaseTag) => {
			const
				envVars = [
					{name: 'DOCKER_HOST', value: `ssh://${host}`},
					{name: 'COMPOSE_CLIENT', value: client},
					{name: 'COMPOSE_FILE', value: composeFile},
					{name: 'COMPOSE_PROJECT', value: project},
					{name: 'COMPOSE_PROJECT_NAME', value: getDockerProjectName()},
					{name: 'COMPOSE_STAGE', value: stage},
					{name: 'COMPOSE_TAG', value: releaseTag}
				]
			;

			Object.keys(compose).forEach((key) => {
				envVars.push({
					name: `COMPOSE_${snakeCase(key).toUpperCase()}`,
					value: compose[key]
				});
			});

			shelljs.exec(`${envVars.map(({name, value}) => `${name}=${value}`).join(' ')} docker-compose ${command}`, {silent: true}, callback);
		}
	;

	if (tag) {
		onHandleTag(tag);
	} else {
		getDeployedTag(onHandleTag);
	}
}
