jest.mock('../configuration');

import merge from 'deepmerge';

import {configuration} from '../configuration';


const
	config = configuration()
;


global.config = merge(config.deployment.common, config.deployment.instances.foo);
