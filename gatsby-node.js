const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const webpack = require('webpack')

exports.onCreateWebpackConfig = ({ actions }) => {
    actions.setWebpackConfig({
        plugins: [
            new NodePolyfillPlugin(),
            new webpack.DefinePlugin({
                'process.browser': true,
              })
        ],    
        resolve: {
            fallback: {
                assert: require.resolve("assert"),
                crypto: require.resolve("crypto-browserify"),
                http:  require.resolve("stream-http"),
                https: require.resolve("https-browserify"),
                os: require.resolve("os-browserify/browser"),
                stream: require.resolve("stream-browserify"),
            },
        },
    })
  }