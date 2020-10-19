jest.mock('shelljs', () => {
	return {
		exec: jest.fn()
	};
});
