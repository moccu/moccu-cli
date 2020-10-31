module.exports = {
	clearMocks: true,
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/__mocks__/',
		'/__setup__/',
	],
	moduleDirectories: [
		'node_modules',
		'src'
	],
	setupFiles: [
		'./src/__setup__/chalk.js',
		'./src/__setup__/config.js',
		'./src/__setup__/dayjs.js',
		'./src/__setup__/natural-orderby.js',
		'./src/__setup__/ora.js',
		'./src/__setup__/shelljs.js',
		'./src/__setup__/simple-git.js'
	],
	testEnvironment: 'node',
	transform: {
		'^.+\\.js$': 'babel-jest'
	}
};
