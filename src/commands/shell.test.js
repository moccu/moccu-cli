jest.mock('../utils');

import mockedEnv from 'mocked-env';

import {runShell} from './shell';

import {getContainerId} from '../utils';


describe('The runShell command', () => {
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

	it('should return commands to go into the container shell', () => {
		const
			logMock = jest.spyOn(console, 'log').mockImplementation(() => jest.fn())
		;

		getContainerId.mockImplementationOnce((command, callback) => callback('containerIDServer'));
		getContainerId.mockImplementationOnce((command, callback) => callback('containerIDPostgres'));

		runShell();

		expect(logMock).toHaveBeenNthCalledWith(1, 'Server:\t\tDOCKER_HOST=ssh://foo-host docker exec -it containerIDServer ash');
		expect(logMock).toHaveBeenNthCalledWith(2, 'Database:\tDOCKER_HOST=ssh://foo-host docker exec -it containerIDPostgres bash');

		logMock.mockRestore();
	});
});
