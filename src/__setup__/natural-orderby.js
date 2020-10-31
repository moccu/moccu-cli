jest.mock('natural-orderby', () => {
	return {
		orderBy: jest.fn((value) => value)
	};
});
