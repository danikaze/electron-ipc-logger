import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { join } from 'path';
import { Configuration, DefinePlugin } from 'webpack';

export const BUILD_MODE =
  process.env.NODE_ENV === 'production'
    ? 'production'
    : process.env.NODE_ENV === 'preview'
      ? 'preview'
      : 'development';

export function absolutePath(...relativePath: string[]): string {
  return join(__dirname, '..', ...relativePath);
}

/*
 * Note that this configuration is only for the extension part
 * The library is "built" with tsc
 */
export const baseConfig: Configuration = {
  mode: BUILD_MODE === 'production' ? 'production' : 'development',
  watch: BUILD_MODE === 'development',
  module: {
    rules: [
      // code
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      // css modules
      {
        test: /\.s?css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[path][name]__[local]--[hash:base64:5]',
              },
              esModule: false,
              sourceMap: BUILD_MODE !== 'production',
              importLoaders: 1,
            },
          },
          'sass-loader',
        ],
        include: /\.module\.s?(c|a)ss$/,
      },
      // css (non-module)
      {
        test: /\.s?css$/,
        exclude: /\.module\.s?css$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new DefinePlugin({
      'process.env.BUILD_MODE': JSON.stringify(BUILD_MODE),
    }),
  ],
};
