const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const dist = path.resolve(__dirname, "dist");

module.exports = [
    {
        entry: './src/bootstrap.js',
        output: {
            path: dist,
            filename: 'bootstrap.js',
        },
        mode: 'development',
        plugins: [
            new CopyWebpackPlugin(['src/index.html'])
        ],
    },
    {
        entry: './src/worker.js',
        target: 'webworker',
        plugins: [
        ],
        resolve: {
            extensions: ['.js', '.wasm']
        },
        mode: 'development',
        output: {
            path: dist,
            filename: 'worker.js'
        }
    }];
