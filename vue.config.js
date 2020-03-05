const CompressionPlugin = require('compression-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

module.exports = {
  chainWebpack: config => {
    config.module.rule('ts').use('ts-loader').loader('ts-loader').tap(options => { return options });
    config.plugins.delete('friendly-errors');
    config.plugin('fork-ts-checker').tap(args => {
      args[0].tsconfig = './src/client/tsconfig.json'
      return args
    });
  },
  configureWebpack: {
    devServer: {
      contentBase: './src/client/public',
      compress: true
    },
    plugins: [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|json|css|html|svg|ttf|woff)$/
      }),
      new CopyPlugin([
        { from: 'src/client/public/img/icons', to: 'img/icons' }
      ]),
      new FriendlyErrorsWebpackPlugin()
    ],
    stats: {
      warningsFilter: warn => warn.indexOf('Conflicting order between:') > -1
    }
  },
  outputDir:'./www',
  pages: {
    index: {
      entry: './src/client/main.ts',
      filename: 'index.html',
      template: './src/client/public/index.html',
      title: 'Digital Catalog'
    }
  },
  runtimeCompiler: true
}
