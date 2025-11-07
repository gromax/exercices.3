'use strict';

const webpack = require('webpack');
const packageJson = require('./package.json');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { merge } = require('webpack-merge');
const { proxy } = require('jquery');

const webpackCommon = {
  entry: {
    app: ['./app/initialize']
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.jst$/,
        use: 'underscore-template-loader'
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  output: {
    filename: 'app.js',
    path: path.join(__dirname, './public'),
    publicPath: '/'
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'app.css' }),
    new CopyWebpackPlugin({
      patterns:[
        { from: './app/assets/index.html', to: './index.html' },
        { from: './app/assets/.htaccess', to: './.htaccess' },
        { from: './app/assets/favicon.ico', to: './favicon.ico' },
        { from: './app/assets/api.php', to: './api.php' },
        { from: './app/assets/ajax.gif', to: './ajax.gif' }
      ]
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      _: 'underscore'
    }),
    new webpack.DefinePlugin({
      APP_VERSION: JSON.stringify(packageJson.version),
    })
  ],
  resolve: {
    modules: [path.resolve(__dirname, './app'), 'node_modules'],
    alias: {
      '@components': path.resolve(__dirname, 'app/components'),
      '@entities': path.resolve(__dirname, 'app/components/entities'),
      '@apps': path.resolve(__dirname, 'app/components/apps'),
      '@styles': path.resolve(__dirname, 'app/styles'),
      '@templates': path.resolve(__dirname, 'app/templates'),
      '@tools': path.resolve(__dirname, 'app/tools'),
      'jsxgraph/distrib/jsxgraph.css': require('path').resolve(__dirname, 'node_modules/jsxgraph/distrib/jsxgraph.css')
      // Ajoute d'autres alias si besoin
    }
  },
};

switch (process.env.npm_lifecycle_event) {
  case 'start':
  case 'dev':
    module.exports = merge(webpackCommon, {
      mode: 'development',
      devtool: 'inline-source-map',
      devServer: {
        static: {
          directory: path.join(__dirname, './public'),
        },
        proxy: [
          {
            context: ['/api'],
            target: "http://localhost/exercices.3/public/",
            changeOrigin: true,
            secure: false
          }
        ],
        hot: true,
        open: true
      }
    });
    break;
  default:
    module.exports = merge(webpackCommon, {
      devtool: 'source-map'
    });
    break;
}
