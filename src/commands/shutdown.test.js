jest.mock('../utils');

import ora from 'ora';

import {shutdown} from './shutdown';

import {dockerCompose} from '../utils';


describe('The shutdown command', () => {
	it('should stop the container', () => {
		dockerCompose.mockImplementation((command, callback) => callback(0, ''));

		shutdown();

		expect(ora).toHaveBeenCalledTimes(1);
		expect(ora).toHaveBeenCalledWith({text: 'Stop container', color: 'cyan'});
		expect(ora.start).toHaveBeenCalledTimes(1);
		expect(ora.succeed).toHaveBeenCalledTimes(1);
		expect(ora.succeed).toHaveBeenCalledWith('Container successfully stopped');
		expect(dockerCompose).toHaveBeenCalledTimes(1);
		expect(dockerCompose).toHaveBeenCalledWith('stop', expect.any(Function));
	});

	it('should throw error on stop', () => {
		dockerCompose.mockImplementation((command, callback) => callback(1, '', 'ERROR'));

		shutdown();

		expect(ora.fail).toHaveBeenCalledTimes(1);
		expect(ora.fail).toHaveBeenCalledWith('ERROR');
		expect(dockerCompose).toHaveBeenCalledTimes(1);
		expect(dockerCompose).toHaveBeenCalledWith('stop', expect.any(Function));
	});

	it('should stop and remove the container', () => {
		dockerCompose.mockImplementation((command, callback) => callback(0, ''));

		shutdown(true);

		expect(ora).toHaveBeenCalledTimes(2);
		expect(ora).toHaveBeenNthCalledWith(2, {text: 'Remove container', color: 'cyan'});
		expect(ora.start).toHaveBeenCalledTimes(2);
		expect(ora.succeed).toHaveBeenCalledTimes(2);
		expect(ora.succeed).toHaveBeenNthCalledWith(2, 'Container successfully removed');
		expect(dockerCompose).toHaveBeenCalledTimes(2);
		expect(dockerCompose).toHaveBeenNthCalledWith(2, 'rm -v', expect.any(Function));
	});

	it('should throw error on remove', () => {
		dockerCompose.mockImplementationOnce((command, callback) => callback(0, ''));
		dockerCompose.mockImplementationOnce((command, callback) => callback(1, '', 'ERROR'));

		shutdown(true);

		expect(ora.fail).toHaveBeenCalledTimes(1);
		expect(ora.fail).toHaveBeenCalledWith('ERROR');
		expect(dockerCompose).toHaveBeenCalledTimes(2);
		expect(dockerCompose).toHaveBeenNthCalledWith(2, 'rm -v', expect.any(Function));
	});
});
