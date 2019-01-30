const path = require('path');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const sharedConfig = {
    module: {
        rules: [
            {
                loader: 'raw-loader',
                test: /\.(glsl|frag|vert)$/,
                include: [ path.resolve(__dirname, 'node_modules/mol-star-proto/build/src/') ],
            },
            {
                loader: 'glslify-loader',
                test: /\.(glsl|frag|vert)$/,
                include: [ path.resolve(__dirname, 'node_modules/mol-star-proto/build/src/') ]
            },

            {
                loader: 'file-loader',
                test: /\.(woff2?|ttf|otf|eot|svg|html)$/,
                include: [ path.resolve(__dirname, 'build/src/') ],
                options: {
                    name: '[name].[ext]'
                }
            },
            {
                test:/\.(s*)css$/,
                use: [ MiniCssExtractPlugin.loader, 'css-loader', 'resolve-url-loader', 'sass-loader' ]
            }
        ]
    },
    plugins: [
        new ExtraWatchWebpackPlugin({
            files: [
                './build/src/**/*.scss',
                './build/src/**/*.html'
            ],
        }),
        new MiniCssExtractPlugin({ filename: "app.css" })
    ],
    resolve: {
        modules: [
            'node_modules',
            path.resolve(__dirname, 'build/src/'),
            path.resolve(__dirname, 'node_modules/mol-star-proto/build/src/')
        ],
        alias: {
            "mol-star-proto": "mol-star-proto/build",
        },
    }
}

function createEntryPoint(name, dir, out) {
    return {
        entry: path.resolve(__dirname, `build/src/${dir}/${name}.js`),
        output: {
            library: 'App',
            libraryTarget: 'umd',
            filename: `${name}.js`,
            path: path.resolve(__dirname, `build/${out}`)
        },
        ...sharedConfig
    }
}

module.exports = [
    createEntryPoint('index', 'simple-viewer', 'simple-viewer')
]