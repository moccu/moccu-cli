jest.mock('../utils');
jest.mock('./database');

import inquirer from 'inquirer';
import mockedEnv from 'mocked-env';
import ora from 'ora';
import shelljs from 'shelljs';

import {migrate as migrateDb} from './database';
import {deploy} from './deploy';

import {dockerCompose, getDeployedTag, getDockerImageName, getLatestTag} from '../utils';


const flushPromises = () => new Promise(setImmediate);

describe('The deploy command', () => {
	let
		restore = null
	;

	beforeEach(() => {
		restore = mockedEnv({
			instance: 'foo'
		});
	});

	afterEach(() => {
		restore();
	});

	it('should deploy latest tag', async () => {
		const
			deployedTag = '0.0.1',
			releaseTag = '0.0.2',
			dockerImageName = 'foo',
			cwd = 'root',
			host = 'foo-host',
			execMock = jest.spyOn(shelljs, 'exec').mockImplementationOnce((command, options, callback) => callback(0)),
			cwdMock = jest.spyOn(process, 'cwd').mockReturnValueOnce(cwd)
		;

		jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({deployConfirm: true}));
		getDeployedTag.mockImplementationOnce((callback) => callback(deployedTag));
		getDockerImageName.mockImplementationOnce(() => dockerImageName);
		getLatestTag.mockImplementationOnce(() => releaseTag);
		dockerCompose.mockImplementationOnce((command, callback) => callback(0));

		deploy({});

		await flushPromises();

		expect(ora).toHaveBeenCalledTimes(2);
		expect(ora).toHaveBeenNthCalledWith(1, {text: 'Rebuild nginx container', color: 'cyan'});
		expect(ora).toHaveBeenNthCalledWith(2, {text: `Deploy new release with tag ${releaseTag}`, color: 'cyan'});
		expect(ora.start).toHaveBeenCalledTimes(2);
		expect(ora.succeed).toHaveBeenCalledTimes(2);
		expect(ora.succeed).toHaveBeenNthCalledWith(1, 'Rebuild successfully completed');
		expect(ora.succeed).toHaveBeenNthCalledWith(2, `New Release ${releaseTag} successful deployed on ${host}`);
		expect(getDeployedTag).toHaveBeenCalledTimes(1);
		expect(getLatestTag).toHaveBeenCalledTimes(1);
		expect(inquirer.prompt).toHaveBeenCalledTimes(1);
		expect(inquirer.prompt).toHaveBeenCalledWith(expect.objectContaining({message: `Update from ${deployedTag} to ${releaseTag} on ${host}?`}));
		expect(execMock).toHaveBeenCalledWith(
			`DOCKER_HOST=ssh://${host} docker build -t ${dockerImageName} -f ${cwd}/deployment/Dockerfile.nginx deployment`,
			{silent: true},
			expect.any(Function)
		);
		expect(dockerCompose).toHaveBeenCalledWith('up -d', expect.any(Function), releaseTag);

		execMock.mockRestore();
		cwdMock.mockRestore();
	});

	it('should exit on reject deploy confirm', async () => {
		const
			logMock = jest.spyOn(console, 'log').mockImplementation(() => jest.fn()),
			exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn())
		;

		jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({deployConfirm: false}));
		getDeployedTag.mockImplementationOnce((callback) => callback('foo'));
		getLatestTag.mockImplementationOnce(() => 'bar');

		deploy({});

		await flushPromises();

		expect(logMock).toHaveBeenCalledWith('Deployment cancelled!');
		expect(exitMock).toHaveBeenCalledTimes(1);

		logMock.mockRestore();
		exitMock.mockRestore();
	});

	it('should fail on rebuild nginx container', async () => {
		const
			execMock = jest.spyOn(shelljs, 'exec').mockImplementationOnce((command, options, callback) => callback(1, '', 'ERROR')),
			exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn())
		;

		jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({deployConfirm: true}));
		getDeployedTag.mockImplementationOnce((callback) => callback('foo'));
		getLatestTag.mockImplementationOnce(() => 'bar');

		deploy({});

		await flushPromises();

		expect(ora).toHaveBeenCalledTimes(1);
		expect(ora.start).toHaveBeenCalledTimes(1);
		expect(ora.fail).toHaveBeenCalledTimes(1);
		expect(ora.fail).toHaveBeenCalledWith('ERROR');
		expect(exitMock).toHaveBeenCalledTimes(1);

		execMock.mockRestore();
		exitMock.mockRestore();
	});

	it('should migrate after deploy', async () => {
		const
			execMock = jest.spyOn(shelljs, 'exec').mockImplementationOnce((command, options, callback) => callback(0))
		;

		jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({deployConfirm: true}));
		getDeployedTag.mockImplementationOnce((callback) => callback());
		getDockerImageName.mockImplementationOnce(() => 'foo');
		getLatestTag.mockImplementationOnce(() => 'foo');
		dockerCompose.mockImplementationOnce((command, callback) => callback(0));
		migrateDb.mockImplementationOnce(jest.fn());

		deploy({migrate: true});

		await flushPromises();

		expect(migrateDb).toHaveBeenCalledTimes(1);

		execMock.mockRestore();
	});

	it('should fail on deploy', async () => {
		const
			execMock = jest.spyOn(shelljs, 'exec').mockImplementationOnce((command, options, callback) => callback(0)),
			exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn())
		;

		jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({deployConfirm: true}));
		getDeployedTag.mockImplementationOnce((callback) => callback('foo'));
		getLatestTag.mockImplementationOnce(() => 'bar');
		dockerCompose.mockImplementationOnce((command, callback) => callback(1, '', 'ERROR'));

		deploy({});

		await flushPromises();

		expect(ora).toHaveBeenCalledTimes(2);
		expect(ora.start).toHaveBeenCalledTimes(2);
		expect(ora.fail).toHaveBeenCalledTimes(1);
		expect(ora.fail).toHaveBeenCalledWith('ERROR');
		expect(exitMock).toHaveBeenCalledTimes(1);

		execMock.mockRestore();
		exitMock.mockRestore();
	});
});
