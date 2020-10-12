const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const index = 'index';

module.exports = {
  entry: './src/app/app.ts',
  devtool: 'inline-source-map',
  mode: 'production',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  performance: {
    maxEntrypointSize: 640000,
    maxAssetSize: 640000,
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    port: 8080,
    compress: true,
    inline: true,
    // Send API requests on localhost to API server get around CORS.
    proxy: {
      '/api': {
        target: {
          host: '0.0.0.0',
          protocol: 'http:',
          port: 8081,
        },
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
  plugins: [
    // new HtmlWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].bundle.css',
    }),
    new CopyWebpackPlugin([
      {
        from: `./${index}.html`,
      },
    ]),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
