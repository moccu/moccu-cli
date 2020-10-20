export const configuration = jest.fn(() => {
	return {
		deployment: {
			common: {
				client: 'client',
				project: 'project',
				compose: {
					nodeCommand: 'nodeCommand'
				}
			},
			instances: {
				foo: {
					host: 'foo-host',
					stage: 'foo-stage',
					compose: {
						envFile: 'foo-envFile'
					}
				},
				bar: {
					host: 'bar-host',
					stage: 'bar-stage',
					compose: {
						envFile: 'bar-envFile',
						customVariable: 'bar-custom'
					}
				}
			}
		}
	};
});
