import fs from 'fs';
import yaml from 'js-yaml';
import stripComments from 'strip-json-comments';


export function configuration() {
	const
		configFile = `${process.cwd()}/.moccu`
	;

	// eslint-disable-next-line no-sync
	if (!fs.existsSync(configFile)) {
		throw new Error('Configfile not found.');
	}

	const
		file = yaml.safeLoad(
			stripComments(
				// eslint-disable-next-line no-sync
				fs.readFileSync(configFile, 'utf8')
			)
		)
	;

	return file;
}
