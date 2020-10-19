jest.mock('../utils');

import inquirer from 'inquirer';
import simpleGit from 'simple-git';

import {release, __RewireAPI__ as releaseCommand} from './release';

import {getLatestTag, getNextTag, pushTag} from '../utils';


jest.mock('../configuration');

describe('The release command', () => {
	it('should push new tag on master', async () => {
		const
			simpleGitMockResponse = {
				status: jest.fn(() => Promise.resolve({current: 'master'}))
			}
		;

		simpleGit.mockReturnValue(simpleGitMockResponse);
		jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({release: 'm'}));
		jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({pushConfirm: true}));

		getLatestTag.mockImplementationOnce(() => '0.0.1');
		getNextTag.mockImplementationOnce(() => '0.0.2');
		pushTag.mockImplementation(() => jest.fn());

		await release();

		expect(inquirer.prompt).toHaveBeenCalledTimes(2);
		expect(inquirer.prompt).toHaveBeenNthCalledWith(1, expect.objectContaining({message: 'Please enter the type of release [m]ajor, [f]eature, [b]uild'}));
		expect(inquirer.prompt).toHaveBeenNthCalledWith(2, expect.objectContaining({message: `Release and push version 0.0.2?`}));
		expect(pushTag).toHaveBeenCalledWith('0.0.2', 'major');
	});

	it('should push new tag on feature branch', async () => {
		const
			simpleGitMockResponse = {
				status: jest.fn(() => Promise.resolve({current: 'develop'}))
			}
		;

		simpleGit.mockReturnValue(simpleGitMockResponse);
		jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({pushConfirm: true}));

		getLatestTag.mockImplementationOnce(() => 'develop.001');
		getNextTag.mockImplementationOnce(() => 'develop.002');
		pushTag.mockImplementation(() => jest.fn());

		await release();

		expect(inquirer.prompt).toHaveBeenCalledTimes(1);
		expect(inquirer.prompt).toHaveBeenCalledWith(expect.objectContaining({message: `Release and push version develop.002?`}));
		expect(pushTag).toHaveBeenCalledWith('develop.002', 'develop branch');
	});

	it('should validate answer for release', () => {
		const
			questions = releaseCommand.__get__('QUESTIONS'),
			release = questions.release()
		;

		expect(release.validate('a')).toBe('Please enter the type of release [m]ajor, [f]eature, [b]uild');
		expect(release.validate('M')).toBeTruthy();
		expect(release.validate('m')).toBeTruthy();
		expect(release.validate('F')).toBeTruthy();
		expect(release.validate('f')).toBeTruthy();
		expect(release.validate('B')).toBeTruthy();
		expect(release.validate('b')).toBeTruthy();
	});

	it('should exit, because locale is ahead', async () => {
		const
			logMock = jest.spyOn(console, 'log').mockImplementation(() => jest.fn()),
			exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn()),
			simpleGitMockResponse = {
				status: jest.fn(() => Promise.resolve({ahead: 1}))
			}
		;

		simpleGit.mockReturnValue(simpleGitMockResponse);
		getLatestTag.mockImplementationOnce(() => '0.0.1');

		await release();

		expect(logMock).toHaveBeenCalledWith('Current HEAD is not pushed to remote');
		expect(exitMock).toHaveBeenCalledTimes(1);

		logMock.mockRestore();
		exitMock.mockRestore();
	});

	it('should exit on reject push confirm', async () => {
		const
			logMock = jest.spyOn(console, 'log').mockImplementation(() => jest.fn()),
			exitMock = jest.spyOn(process, 'exit').mockImplementation(() => jest.fn()),
			simpleGitMockResponse = {
				status: jest.fn(() => Promise.resolve({current: 'develop'}))
			}
		;

		simpleGit.mockReturnValue(simpleGitMockResponse);
		jest.spyOn(inquirer, 'prompt').mockImplementationOnce(() => Promise.resolve({pushConfirm: false}));

		getLatestTag.mockImplementationOnce(() => '0.0.1');

		await release();

		expect(logMock).toHaveBeenCalledWith('Release cancelled!');
		expect(exitMock).toHaveBeenCalledTimes(1);

		logMock.mockRestore();
		exitMock.mockRestore();
	});
});
