import babel from 'rollup-plugin-babel';

export default {
  entry: 'dist-es2015/index.js',
  moduleName: 'DynamicTypedArray',
  moduleId: 'dynamic-typed-array',
  sourceMap: true,
  plugins: [
    babel()
  ],
  targets: [
    { dest: 'dist/dynamic-typed-array.js', format: 'umd' },
    { dest: 'dist/dynamic-typed-array.es.js', format: 'es' }
  ]
};
