export const configuration = jest.fn(() => {
	return {
		deployment: {
			common: {
				client: 'client',
				project: 'project',
				nodeCommand: 'nodeCommand'
			},
			instances: {
				foo: {
					host: 'foo-host',
					stage: 'foo-stage',
					envFile: 'foo-envFile'
				},
				bar: {
					host: 'bar-host',
					stage: 'bar-stage',
					envFile: 'bar-envFile'
				}
			}
		}
	};
});
