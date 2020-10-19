jest.mock('./commands');

import yargs from 'yargs';

import {cli} from './cli';
import {deploy, downloadDb, dumpDb, migrateDb, restoreDb, release, runShell, shutdown} from './commands';


jest.mock('./configuration');

describe('The cli', () => {
	it('should run release', () => {
		release.mockImplementation(() => jest.fn());

		yargs('release');

		cli();

		expect(release).toHaveBeenCalledTimes(1);
	});

	it('should run deploy', () => {
		deploy.mockImplementation(() => jest.fn());

		yargs('deploy foo');

		cli();

		expect(deploy).toHaveBeenCalledTimes(1);
	});

	it('should run migrate', () => {
		deploy.mockImplementation(() => jest.fn());

		yargs('migrate foo');

		cli();

		expect(migrateDb).toHaveBeenCalledTimes(1);
	});

	it('should run downloaddb', () => {
		downloadDb.mockImplementation(() => jest.fn());

		yargs('downloaddb foo');

		cli();

		expect(downloadDb).toHaveBeenCalledTimes(1);
	});

	it('should run dumpdb', () => {
		dumpDb.mockImplementation(() => jest.fn());

		yargs('dumpdb foo');

		cli();

		expect(dumpDb).toHaveBeenCalledTimes(1);
	});

	it('should run restoredb', () => {
		runShell.mockImplementation(() => jest.fn());

		yargs('restoredb foo');

		cli();

		expect(restoreDb).toHaveBeenCalledTimes(1);
	});

	it('should run shell', () => {
		runShell.mockImplementation(() => jest.fn());

		yargs('shell foo');

		cli();

		expect(runShell).toHaveBeenCalledTimes(1);
	});

	it('should run shutdown', () => {
		runShell.mockImplementation(() => jest.fn());

		yargs('shutdown foo');

		cli();

		expect(shutdown).toHaveBeenCalledTimes(1);
	});

	it('should show help', () => {
		const
			exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn()),
			logMock = jest.spyOn(console, 'log').mockImplementation(() => jest.fn())
		;

		yargs('--help');

		cli();

		expect(exitMock).toHaveBeenCalledTimes(1);
		expect(logMock).toHaveBeenCalledTimes(1);

		exitMock.mockRestore();
		logMock.mockRestore();
	});
});
