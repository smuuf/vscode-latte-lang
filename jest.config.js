module.exports = {
	testEnvironment: 'node',
	maxWorkers: '20%',
	transform: {
		'^.+\\.(t|j)sx?$': '@swc/jest',
	},
};
