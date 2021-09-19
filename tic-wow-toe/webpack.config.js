import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'main.js'
  },
  devtool: "eval"
}
export default config 