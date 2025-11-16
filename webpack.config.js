'use strict';

const webpack = require('webpack');
const packageJson = require('./package.json');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');
const { merge } = require('webpack-merge');

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
          'style-loader',
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
    new CopyWebpackPlugin({
      patterns:[
        { from: path.resolve(__dirname, 'app/assets/.htaccess'), to: '.htaccess', toType: 'file' }, // copie le fichier .htaccess (pb à cause du .)
        { from: './app/assets/favicon.ico', to: './favicon.ico' },
        { from: './app/assets/api.php', to: './api.php' },
        { from: './app/assets/ajax.gif', to: './ajax.gif' },
        { from: './app/assets/install.php', to: './install.php' }
      ]
    }),
    // Génère le fichier index.html dans /public avec les bons liens vers les fichiers CSS et JS
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'app/assets/index.html'),
      filename: 'index.html',
      inject: 'body',
      minify: process.env.npm_lifecycle_event === 'build' ? {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true
      } : false
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
  case 'build':
    // production build : minified, hashed filenames, split chunks, source-map
    module.exports = merge(webpackCommon, {
      mode: 'production',
      devtool: false, // pas de source-map en production pour l'instant
      output: {
        filename: 'app.[contenthash].js',
        path: path.join(__dirname, './public'),
        publicPath: '/'
      },
      optimization: {
        minimize: true,
        splitChunks: false
      },
      module: {
        rules: [
          {
            test: /\.css$/,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader'
            ]
          }
        ]
      },
      plugins: [
        new CleanWebpackPlugin(),
        // override CSS filename for production
        new MiniCssExtractPlugin({ filename: '[name].[contenthash].css', chunkFilename: '[id].[contenthash].css' }),
        new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production') })
      ]
    });
    break;

  default:
    module.exports = merge(webpackCommon, {
      devtool: 'source-map'
    });
    break;
}
