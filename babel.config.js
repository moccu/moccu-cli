module.exports = {
	'presets': [
		[
			'@babel/preset-env',
			{
				'targets': {
					'node': '14'
				}
			}
		]
	],
	'plugins': [
		'rewire',
		'@babel/plugin-proposal-optional-chaining'
	]
};
