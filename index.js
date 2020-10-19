#!/usr/bin/env node

const
	requireEsm = require('esm')(module)
;

requireEsm('./src/cli').cli();
