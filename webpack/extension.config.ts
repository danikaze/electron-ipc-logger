import CopyPlugin from 'copy-webpack-plugin';
import { readFileSync } from 'fs';
import merge from 'webpack-merge';
import { absolutePath } from './base.config';

export default merge({
  entry: {
    background: absolutePath('src', 'extension', 'background.ts'),
    content: absolutePath('src', 'extension', 'content.ts'),
    mock: absolutePath('src', 'extension', 'mock.ts'),
    ui: absolutePath('src', 'extension', 'ui.tsx'),
  },
  output: {
    path: absolutePath('dist', 'extension'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: absolutePath('src', 'extension', 'manifest.json'),
          to: absolutePath('dist', 'extension', 'manifest.json'),
          transform: (content) => {
            // parsing the json makes the version to be always updated ;)
            const packageJson = readFileSync(absolutePath('package.json'));
            const { version } = JSON.parse(packageJson.toString());

            return content
              .toString()
              .replace(/"version": "[^"]+"/, `"version": "${version}"`);
          },
        },
        {
          from: absolutePath('src', 'extension', 'index.html'),
          to: absolutePath('dist', 'extension', 'index.html'),
        },
      ],
    }),
  ],
});
