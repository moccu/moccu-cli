jest.mock('chalk', () => {
	return {
		blue: jest.fn((val) => val),
		bold: jest.fn((val) => val),
		dim: jest.fn((val) => val),
		green: jest.fn((val) => val),
		red: jest.fn((val) => val),
		reset: jest.fn((val) => val),
		yellow: jest.fn((val) => val),
		yellowBright: jest.fn((val) => val)
	};
});
