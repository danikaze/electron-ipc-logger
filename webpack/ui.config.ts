import 'webpack-dev-server';
import CopyPlugin from 'copy-webpack-plugin';
import { merge } from 'webpack-merge';
import { absolutePath, baseConfig } from './base.config';

export default merge(baseConfig, {
  entry: {
    index: absolutePath('src', 'ui', 'index.tsx'),
    mock: absolutePath('src', 'ui', 'mock.ts'),
  },
  output: {
    path: absolutePath('dist', 'ui'),
  },
  devServer:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          compress: true,
          port: Number(process.env.PORT) || 9000,
        },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: absolutePath('src', 'ui', 'index.html'),
          to: absolutePath('dist', 'ui', 'index.html'),
        },
      ],
    }),
  ],
});
