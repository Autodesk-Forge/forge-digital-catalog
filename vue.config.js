const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
    chainWebpack: config => {
        config.plugins.delete('friendly-errors')
    },
    configureWebpack: {
        devServer: {
            compress: true
        },
        plugins: [
            new CompressionPlugin({
                algorithm: 'gzip',
                test: /\.(js|json|css|html|svg|ttf|woff)$/
            })
        ],
        stats: {
            warningsFilter: warn => warn.indexOf('Conflicting order between:') > -1
        }
    },
    outputDir:'./www',
    pages: {
        index: {
            entry: './src/main.js',
            filename: 'index.html',
            template: './public/index.html',
            title: 'Digital Catalog'
        }
    }
}
