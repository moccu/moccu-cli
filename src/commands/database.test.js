jest.mock('../configuration');
jest.mock('../utils');

import dayjs from 'dayjs';
import inquirer from 'inquirer';
import mockedEnv from 'mocked-env';
import ora from 'ora';
import shelljs from 'shelljs';

import {getContainerId, getDockerProjectName} from '../utils';
import {download, dump, migrate, restore, __RewireAPI__ as databaseCommand} from './database';


const flushPromises = () => new Promise(setImmediate);

describe('The database command', () => {
	let
		restoreMocked = null
	;

	beforeEach(() => {
		restoreMocked = mockedEnv({
			instance: 'foo'
		});
	});

	afterEach(() => {
		restoreMocked();
	});

	describe('selectDump function', () => {
		it('should return selection of available dumps', async () => {
			const
				dockerProjectName = 'foo',
				filename = 'foo-file',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0, 'foo\nbar\nbaz')),
				logMock = jest.spyOn(console, 'log').mockImplementation(() => jest.fn()),
				selectDump = databaseCommand.__get__('selectDump'),
				mockFn = jest.fn()
			;

			jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({filename}));

			selectDump(dockerProjectName, mockFn);

			await flushPromises();

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(execMock).toHaveBeenCalledWith(
				`ssh foo-host ls -la /dumps/${dockerProjectName} | awk '{print $5, $9}' | tail -5`,
				{'silent': true},
				expect.any(Function)
			);
			expect(logMock).toHaveBeenCalledWith('Available dumps:');

			execMock.mockRestore();
			logMock.mockRestore();
		});
	});

	describe('migrate function', () => {
		it('should migrate database', () => {
			const
				containerId = 'foo123',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0, 'SUCCESS'))
			;

			getContainerId.mockImplementationOnce((service, callback) => callback(containerId));

			migrate();

			expect(ora).toHaveBeenCalledTimes(1);
			expect(ora).toHaveBeenCalledWith({text: 'Migrate database', color: 'cyan'});
			expect(ora.start).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledWith('Migration completed');
			expect(execMock).toHaveBeenCalledWith(
				`DOCKER_HOST=ssh://foo-host docker exec ${containerId} npm run migrate`,
				{'silent': true},
				expect.any(Function)
			);

			execMock.mockRestore();
		});

		it('should no migration, because database is up to date', () => {
			const
				containerId = 'foo123',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0, 'No migrations were executed, database schema was already up to date'))
			;

			getContainerId.mockImplementationOnce((service, callback) => callback(containerId));

			migrate();

			expect(ora.fail).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledWith('No migrations were executed, database schema was already up to date');

			execMock.mockRestore();
		});

		it('should fail migrate database', () => {
			const
				containerId = 'foo123',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(1, '', 'ERROR'))
			;

			getContainerId.mockImplementationOnce((service, callback) => callback(containerId));

			migrate();

			expect(ora.fail).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledWith('ERROR');

			execMock.mockRestore();
		});
	});

	describe('dump function', () => {
		it('should create new dump on server', () => {
			const
				containerId = 'foo123',
				dockerProjectName = 'foo',
				formattedDate = '19840518-121212',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0)),
				dayjsMockResponse = {
					format: jest.fn(() => formattedDate)
				}
			;

			dayjs.mockReturnValue(dayjsMockResponse);
			getContainerId.mockImplementationOnce((service, callback) => callback(containerId));
			getDockerProjectName.mockImplementationOnce(() => dockerProjectName);

			dump();

			expect(ora).toHaveBeenCalledTimes(1);
			expect(ora).toHaveBeenCalledWith({text: 'Dump database', color: 'cyan'});
			expect(ora.start).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledWith('Dump created');
			expect(dayjsMockResponse.format).toHaveBeenCalledTimes(1);
			expect(execMock).toHaveBeenCalledWith(
				`ssh foo-host 'sh -c "mkdir -p /dumps/${dockerProjectName} && docker exec -i ${containerId} pg_dump -U postgres postgres | gzip > /dumps/${dockerProjectName}/${formattedDate}.sql"'`,
				{'silent': true},
				expect.any(Function)
			);

			execMock.mockRestore();
		});

		it('should fail create new dump on server', () => {
			const
				containerId = 'foo123',
				dockerProjectName = 'foo',
				formattedDate = '19840518-121212',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(1, '', 'ERROR')),
				dayjsMockResponse = {
					format: jest.fn(() => formattedDate)
				}
			;

			dayjs.mockReturnValue(dayjsMockResponse);
			getContainerId.mockImplementationOnce((service, callback) => callback(containerId));
			getDockerProjectName.mockImplementationOnce(() => dockerProjectName);

			dump();

			expect(ora.fail).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledWith('ERROR');

			execMock.mockRestore();
		});
	});

	describe('restore function', () => {
		it('should restore database from given dump', async () => {
			const
				containerId = 'foo123',
				dockerProjectName = 'foo',
				filename = 'foo-file',
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0))
			;

			databaseCommand.__set__('selectDump', jest.fn((dockerProjectName, callback) => callback({name: filename})));

			jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({restoreConfirm: true}));
			getDockerProjectName.mockImplementationOnce(() => dockerProjectName);
			getContainerId.mockImplementationOnce((service, callback) => callback(containerId));

			restore();

			await flushPromises();

			expect(ora).toHaveBeenCalledTimes(1);
			expect(ora).toHaveBeenCalledWith({text: `Restore database with dump ${filename}`, color: 'cyan'});
			expect(ora.start).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledWith('Dump successfully restored');
			expect(inquirer.prompt).toHaveBeenCalledTimes(1);
			expect(inquirer.prompt).toHaveBeenCalledWith(expect.objectContaining({message: `The whole database will be overwritten with ${filename}`}));
			expect(execMock).toHaveBeenNthCalledWith(
				1,
				`DOCKER_HOST=ssh://foo-host docker exec ${containerId} dropdb -U postgres postgres`,
				{'silent': true},
				expect.any(Function)
			);
			expect(execMock).toHaveBeenNthCalledWith(
				2,
				`DOCKER_HOST=ssh://foo-host docker exec ${containerId} createdb -U postgres postgres`,
				{'silent': true},
				expect.any(Function)
			);
			expect(execMock).toHaveBeenNthCalledWith(
				3,
				`ssh foo-host 'sh -c "gzip -cd /dumps/${dockerProjectName}/${filename} | docker exec -i ${containerId} psql -U postgres postgres"'`,
				{'silent': true},
				expect.any(Function)
			);

			execMock.mockRestore();
		});

		it('should fail on dropdb', async () => {
			const
				execMock = jest.spyOn(shelljs, 'exec'),
				exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn())
			;

			databaseCommand.__set__('selectDump', jest.fn((dockerProjectName, callback) => callback({name: ''})));

			execMock.mockImplementation((command, options, callback) => callback(1, '', 'ERROR'));
			jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({restoreConfirm: true}));
			getDockerProjectName.mockImplementationOnce(() => '');
			getContainerId.mockImplementationOnce((service, callback) => callback());

			restore();

			await flushPromises();

			expect(shelljs.exec).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledWith('ERROR');
			expect(exitMock).toHaveBeenCalledTimes(1);

			execMock.mockRestore();
			exitMock.mockRestore();
		});

		it('should fail on createdb', async () => {
			const
				execMock = jest.spyOn(shelljs, 'exec'),
				exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn())
			;

			databaseCommand.__set__('selectDump', jest.fn((dockerProjectName, callback) => callback({name: ''})));

			execMock.mockImplementationOnce((command, options, callback) => callback(0));
			execMock.mockImplementationOnce((command, options, callback) => callback(1, '', 'ERROR'));
			jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({restoreConfirm: true}));
			getDockerProjectName.mockImplementationOnce(() => '');
			getContainerId.mockImplementationOnce((service, callback) => callback());

			restore();

			await flushPromises();

			expect(shelljs.exec).toHaveBeenCalledTimes(2);
			expect(ora.fail).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledWith('ERROR');
			expect(exitMock).toHaveBeenCalledTimes(1);

			execMock.mockRestore();
			exitMock.mockRestore();
		});

		it('should fail on import dump', async () => {
			const
				execMock = jest.spyOn(shelljs, 'exec'),
				exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn())
			;

			databaseCommand.__set__('selectDump', jest.fn((dockerProjectName, callback) => callback({name: ''})));

			execMock.mockImplementationOnce((command, options, callback) => callback(0));
			execMock.mockImplementationOnce((command, options, callback) => callback(0));
			execMock.mockImplementationOnce((command, options, callback) => callback(1, '', 'ERROR'));
			jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({restoreConfirm: true}));
			getDockerProjectName.mockImplementationOnce(() => '');
			getContainerId.mockImplementationOnce((service, callback) => callback());

			restore();

			await flushPromises();

			expect(shelljs.exec).toHaveBeenCalledTimes(3);
			expect(ora.fail).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledWith('ERROR');
			expect(exitMock).toHaveBeenCalledTimes(1);

			execMock.mockRestore();
			exitMock.mockRestore();
		});

		it('should cancel on restore decline', async () => {
			const
				exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn()),
				logMock = jest.spyOn(console, 'log').mockImplementation(() => jest.fn())
			;

			databaseCommand.__set__('selectDump', jest.fn((dockerProjectName, callback) => callback({name: ''})));

			jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({restoreConfirm: false}));
			getDockerProjectName.mockImplementationOnce(() => '');

			restore();

			await flushPromises();

			expect(exitMock).toHaveBeenCalledTimes(1);
			expect(logMock).toHaveBeenCalledWith('Restore cancelled!');

			exitMock.mockRestore();
			logMock.mockRestore();
		});
	});

	describe('download function', () => {
		it('should download dump from server', () => {
			const
				cwd = 'root',
				dockerProjectName = 'foo',
				filename = 'foo-file',
				cwdMock = jest.spyOn(process, 'cwd').mockReturnValueOnce(cwd),
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(0))
			;

			databaseCommand.__set__('selectDump', jest.fn((dockerProjectName, callback) => callback({name: filename})));

			getDockerProjectName.mockImplementationOnce(() => dockerProjectName);

			download();

			expect(ora).toHaveBeenCalledTimes(1);
			expect(ora).toHaveBeenCalledWith({text: 'Download dump', color: 'cyan'});
			expect(ora.start).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledTimes(1);
			expect(ora.succeed).toHaveBeenCalledWith(`Dump was successfully downloaded: ${cwd}/dumps/${dockerProjectName}/${filename}`);
			expect(execMock).toHaveBeenCalledWith(
				`scp foo-host:/dumps/${dockerProjectName}/${filename} dumps/${dockerProjectName}`,
				{'silent': true},
				expect.any(Function)
			);

			cwdMock.mockRestore();
			execMock.mockRestore();
		});

		it('should fail download dump from server', () => {
			const
				cwd = 'root',
				dockerProjectName = 'foo',
				filename = 'foo-file',
				cwdMock = jest.spyOn(process, 'cwd').mockReturnValueOnce(cwd),
				execMock = jest.spyOn(shelljs, 'exec').mockImplementation((command, options, callback) => callback(1, '', 'ERROR'))
			;

			databaseCommand.__set__('selectDump', jest.fn((dockerProjectName, callback) => callback({name: filename})));

			getDockerProjectName.mockImplementationOnce(() => dockerProjectName);

			download();

			expect(ora.fail).toHaveBeenCalledTimes(1);
			expect(ora.fail).toHaveBeenCalledWith('ERROR');

			cwdMock.mockRestore();
			execMock.mockRestore();
		});
	});
});
