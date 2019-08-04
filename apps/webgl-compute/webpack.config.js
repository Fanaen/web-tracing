const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const dist = path.resolve(__dirname, "dist");

module.exports = [
    {
        entry: './src/app.js',
        output: {
            path: dist,
            filename: 'app.js',
        },
        mode: 'development',
        plugins: [
            new CopyWebpackPlugin(['src/index.html'])
        ],
        module: {
            rules: [
                {
                    test: /\.glsl$/,
                    use: 'webpack-glsl-loader'
                }
            ],
        },
    }
]
