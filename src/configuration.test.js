jest.unmock('./configuration');

import fs from 'fs';
import mock from 'mock-fs';

import {configuration} from './configuration';


describe('The configuration', () => {
	it('should throw error, if no config-file found', () => {
		const
			cwdMock = jest.spyOn(process, 'cwd').mockReturnValueOnce('root'),
			existsSyncMock = jest.spyOn(fs, 'existsSync').mockImplementation(() => jest.fn())
		;

		existsSyncMock.mockReturnValue(false);

		expect(() => configuration()).toThrow(new Error('Configfile not found.'));

		cwdMock.mockRestore();
		existsSyncMock.mockRestore();
	});

	it('should return config object from .moccu-file', () => {
		const
			spy = jest.spyOn(fs, 'readFileSync')
		;

		mock({'.moccu': '{foo: \'bar\'}'});

		expect(configuration()).toMatchObject({foo: 'bar'});
		expect(fs.readFileSync).toHaveBeenCalledTimes(1); // eslint-disable-line no-sync

		mock.restore();
		spy.mockRestore();
	});
});
