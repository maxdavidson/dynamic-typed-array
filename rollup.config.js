import babel from 'rollup-plugin-babel';

export default {
	entry: 'dist-es2015/index.js',
  dest: 'dist/dynamic-typed-array.js',
	moduleName: 'DynamicTypedArray',
	format: 'umd',
	sourceMap: true,
	plugins: [
		babel()
	]
};
