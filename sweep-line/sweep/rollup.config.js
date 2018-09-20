const buble = require('rollup-plugin-buble');
const cjs = require('rollup-plugin-commonjs');
const node = require('rollup-plugin-node-resolve');

const version = process.env.VERSION || require('./package.json').version

const banner =
  '/*!\n' +
  ' * sweepline v' + version + '\n' +
  ' * (c) 2018 Andrei Kashcha.\n' +
  ' * Released under the MIT License.\n' +
  ' */'
export default {
  input: 'test/findIntersections.js',
  plugins: [
		node(),
		cjs(),
		buble()
	],
  sourcemap: true,
  output: [{
      format: 'umd',
      name: 'i9r',
      file: 'build/i9r.js'
    },
    {
      format: 'es',
      file: 'build/i9r.module.js'
    }
	],
	banner
}
