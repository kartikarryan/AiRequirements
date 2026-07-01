const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Multiple entry points — one per extension context
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/index.ts',
    content: './src/content/index.ts',
    offscreen: './src/offscreen/offscreen.ts',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/index.js',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@popup': path.resolve(__dirname, 'src/popup'),
      '@background': path.resolve(__dirname, 'src/background'),
      '@content': path.resolve(__dirname, 'src/content'),
    },
  },

  plugins: [
    // Generate popup.html with the React app bundle
    new HtmlWebpackPlugin({
      template: './public/popup.html',
      filename: 'popup/index.html',
      chunks: ['popup'],
    }),

    // Copy static files to dist
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/offscreen.html', to: 'offscreen/offscreen.html' },
        { from: 'public/icons', to: 'icons' },
      ],
    }),
  ],

  // Keep source maps for development debugging
  devtool: 'cheap-module-source-map',
};
