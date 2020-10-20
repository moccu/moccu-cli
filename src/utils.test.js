import mockedEnv from 'mocked-env';
import ora from 'ora';
import shelljs from 'shelljs';
import simpleGit from 'simple-git';

import {
	dockerCompose,
	getContainerId,
	getDeployedTag,
	getDockerImageName,
	getDockerProjectName,
	getLatestTag,
	getNextTag,
	pushTag
} from './utils';


const
	TAGS = `
		refs/tags/0.0.1
		refs/tags/0.0.2
		refs/tags/develop.001
		refs/tags/develop.002
		refs/tags/feature-foo.001
		refs/tags/feature-foo.002
	`
;

describe('The utils', () => {
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

	describe('getDockerProjectName-util', () => {
		it('should return docker project name', () => {
			expect(getDockerProjectName()).toBe('clientprojectfoo-stage');
		});
	});

	describe('getDeployedTag-util', () => {
		it('should return current deployed tag with default service', () => {
			const
				version = '1.2.3',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0, `imagename:${version}`)),
				mockFn = jest.fn()
			;

			getDeployedTag(mockFn);

			expect(ora).toHaveBeenCalledTimes(1);
			expect(ora).toHaveBeenCalledWith({text: 'Search for deployed tag', color: 'cyan'});
			expect(ora.start).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledWith(`Current deployed tag is: ${version}`);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenCalledWith(version);
			expect(execMock).toHaveBeenCalledWith(
				'DOCKER_HOST=ssh://foo-host docker ps --filter "label=com.docker.compose.project=clientprojectfoo-stage" --filter "label=com.docker.compose.service=server" --format "{{.Image}}"',
				{'silent': true},
				expect.any(Function)
			);

			execMock.mockRestore();
		});

		it('should return current deployed tag with custom service', () => {
			const
				version = '1.2.3',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0, `imagename:${version}`)),
				mockFn = jest.fn()
			;

			getDeployedTag(mockFn, 'postgres');

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenCalledWith(version);
			expect(execMock).toHaveBeenCalledWith(
				'DOCKER_HOST=ssh://foo-host docker ps --filter "label=com.docker.compose.project=clientprojectfoo-stage" --filter "label=com.docker.compose.service=postgres" --format "{{.Image}}"',
				{'silent': true},
				expect.any(Function)
			);

			execMock.mockRestore();
		});

		it('should return \'nothing\' as tag', () => {
			const
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0, '')),
				mockFn = jest.fn()
			;

			getDeployedTag(mockFn);

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenCalledWith('nothing');

			execMock.mockRestore();
		});
	});

	describe('getLatestTag-util', () => {
		it('should return current deployed tag on master', async () => {
			const
				simpleGitMockResponse = {
					listRemote: jest.fn(() => Promise.resolve(TAGS)),
					status: jest.fn(() => Promise.resolve({current: 'master'}))
				}
			;

			simpleGit.mockReturnValue(simpleGitMockResponse);

			await expect(getLatestTag()).resolves.toStrictEqual('0.0.2');
			expect(ora).toHaveBeenCalledTimes(1);
			expect(ora).toHaveBeenCalledWith({text: 'Search for latest tag', color: 'cyan'});
			expect(ora.start).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledWith('Latest tag is: 0.0.2');
			expect(simpleGitMockResponse.listRemote).toHaveBeenCalledTimes(1);
			expect(simpleGitMockResponse.listRemote).toHaveBeenCalledWith(['--tags']);
			expect(simpleGitMockResponse.status).toHaveBeenCalledTimes(1);
		});

		it('should return current deployed tag on feature-branch', async () => {
			const
				simpleGitMockResponse = {
					listRemote: jest.fn(() => Promise.resolve(TAGS)),
					status: jest.fn(() => Promise.resolve({current: 'feature-foo'}))
				}
			;

			simpleGit.mockReturnValue(simpleGitMockResponse);

			await expect(getLatestTag()).resolves.toStrictEqual('feature-foo.002');
			expect(simpleGitMockResponse.listRemote).toHaveBeenCalledTimes(1);
			expect(simpleGitMockResponse.listRemote).toHaveBeenCalledWith(['--tags']);
			expect(simpleGitMockResponse.status).toHaveBeenCalledTimes(1);
		});

		it('should return current deployed tag on feature-branch from master-branch', async () => {
			simpleGit.mockReturnValue({
				listRemote: () => Promise.resolve(TAGS),
				status: () => Promise.resolve({current: 'master'})
			});

			await expect(getLatestTag('feature-foo')).resolves.toStrictEqual('feature-foo.002');
		});
	});

	describe('getNextTag-util', () => {
		it('should return next tag on master', () => {
			expect(getNextTag('0.0.1', 0)).toBe('1.0.0');
			expect(getNextTag('0.0.1', 1)).toBe('0.1.0');
			expect(getNextTag('0.0.1', 2)).toBe('0.0.2');
		});

		it('should return next tag on feature-branch', () => {
			expect(getNextTag('001')).toBe('002');
		});
	});

	describe('pushTag-util', () => {
		it('should push new tag', async () => {
			const
				simpleGitMockResponse = {
					addAnnotatedTag: jest.fn(),
					pushTags: jest.fn()
				}
			;

			simpleGit.mockReturnValue(simpleGitMockResponse);

			await pushTag('0.0.2', 'build');

			expect(ora).toHaveBeenCalledTimes(2);
			expect(ora).toHaveBeenNthCalledWith(1, {text: 'Add new tag', color: 'cyan'});
			expect(ora).toHaveBeenNthCalledWith(2, {text: 'Push new tag to remote', color: 'cyan'});
			expect(ora.start).toHaveBeenCalledTimes(2);
			expect(ora.succeed).toHaveBeenCalledTimes(2);
			expect(ora.succeed).toHaveBeenNthCalledWith(1, 'New tag successfully added');
			expect(ora.succeed).toHaveBeenNthCalledWith(2, 'New tag successfully pushed');
			expect(simpleGitMockResponse.addAnnotatedTag).toHaveBeenCalledWith('0.0.2', 'Generated build release: 0.0.2');
			expect(simpleGitMockResponse.pushTags).toHaveBeenCalledWith('origin');
		});
	});

	describe('getDockerImageName-util', () => {
		it('should return image name', () => {
			expect(getDockerImageName()).toBe('client-project:latest');
		});

		it('should return image name with extraLabel', () => {
			expect(getDockerImageName('foo')).toBe('client-project-foo:latest');
		});
	});

	describe('getContainerId-util', () => {
		it('should exit, because multiple container where found', () => {
			const
				stdout = 'foo\nbar\nbaz',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0, stdout)),
				mockFn = jest.fn(),
				exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn())
			;

			getContainerId('server', mockFn);

			expect(ora).toHaveBeenCalledTimes(1);
			expect(ora).toHaveBeenCalledWith({text: 'Search for container-id', color: 'cyan'});
			expect(ora.start).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledWith('No or multiple containers found');
			expect(ora.succeed).not.toHaveBeenCalled();
			expect(mockFn).not.toHaveBeenCalled();
			expect(execMock).toHaveBeenCalledWith(
				'DOCKER_HOST=ssh://foo-host docker ps --filter "label=com.docker.compose.project=clientprojectfoo-stage" --filter "label=com.docker.compose.service=server" --format "{{.ID}}"',
				{'silent': true},
				expect.any(Function)
			);
			expect(exitMock).toHaveBeenCalledTimes(1);

			execMock.mockRestore();
			exitMock.mockRestore();
		});

		it('should return container id', () => {
			const
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0, 'foo\n')),
				mockFn = jest.fn()
			;

			getContainerId('server', mockFn);

			expect(ora.succeed).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledWith(`Container with ID foo found`);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenCalledWith('foo');

			execMock.mockRestore();
		});
	});

	describe('dockerCompose-util', () => {
		it('should call docker compose on shell with tag', () => {
			const
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback()),
				cwdMock = jest.spyOn(process, 'cwd').mockReturnValueOnce('root')
			;

			dockerCompose('up -d', jest.fn(), 'bar');

			expect(execMock).toHaveBeenCalledWith(
				'DOCKER_HOST=ssh://foo-host COMPOSE_CLIENT=client COMPOSE_FILE=root/deployment/docker-compose.yml COMPOSE_PROJECT=project COMPOSE_PROJECT_NAME=clientprojectfoo-stage COMPOSE_STAGE=foo-stage COMPOSE_TAG=bar COMPOSE_NODE_COMMAND=nodeCommand COMPOSE_ENV_FILE=foo-envFile docker-compose up -d',
				{silent: true},
				expect.any(Function)
			);

			execMock.mockRestore();
			cwdMock.mockRestore();
		});

		it('should call docker compose on shell without tag', () => {

			/**
			 * @TODO: Mock getDeployedTag inside of dockerCompose()
			 */
			const
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0, 'imagename:0.0.1')),
				cwdMock = jest.spyOn(process, 'cwd').mockReturnValueOnce('root')
			;

			dockerCompose('up -d', jest.fn());

			expect(execMock).toHaveBeenNthCalledWith(
				2,
				'DOCKER_HOST=ssh://foo-host COMPOSE_CLIENT=client COMPOSE_FILE=root/deployment/docker-compose.yml COMPOSE_PROJECT=project COMPOSE_PROJECT_NAME=clientprojectfoo-stage COMPOSE_STAGE=foo-stage COMPOSE_TAG=0.0.1 COMPOSE_NODE_COMMAND=nodeCommand COMPOSE_ENV_FILE=foo-envFile docker-compose up -d',
				{silent: true},
				expect.any(Function)
			);

			execMock.mockRestore();
			cwdMock.mockRestore();
		});
	});
});
