jest.mock('ora', () => {
	const
		fail = jest.fn(),
		succeed = jest.fn(),
		start = jest.fn(() => ({fail, stop, succeed})),
		stop = jest.fn(),
		ora = jest.fn(() => ({start}))
	;

	ora.start = start;
	ora.stop = stop;
	ora.fail = fail;
	ora.succeed = succeed;

	return ora;
});
