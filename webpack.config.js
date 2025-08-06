const path = require('path');

module.exports = {
    entry: './src/scripts/app.js',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'public/js'),
    },
    mode: 'development',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js']
    }
}; 