import { createHash } from 'crypto';
import { join, basename, relative, sep, dirname } from 'path';

/**
 * Provide nice class names used by CSS modules
 *
 * The default classnames are like `${CLASSNAME_HASH}, which might be confusing in development
 * This provides `${FILEPATH_CLASSNAME_HASH}` for easier debugging in development
 *
 * The difference with using `[name]__[local]__[hash:base64:5]` is that `[name]` translates to
 * something like `app-module` in a file like `app.module.scss` which doesn't provide much
 * information and the `module` part is redundant as it's going to exist everywhere *
 */
export function getNiceScopedName(prefix = '', hashLength = 5) {
  // ideally, every `.module.scss` file will be part of a react component
  // placed in src/renderer/components
  const components = join(__dirname, 'src', 'renderer', 'components');

  return (className: string, resourcePath: string): string => {
    const hash = getCssHash(resourcePath, className, hashLength);

    const rel = basename(relative(components, resourcePath)).replaceAll(
      sep,
      '-'
    );
    const folder = basename(dirname(resourcePath));
    const resourceFilename = basename(resourcePath).replace(
      /\.module\.((c|sa|sc)ss)$/i,
      ''
    );
    const filename =
      rel === basename(resourcePath)
        ? // if the file was not in components (couldn't resolve relative)
          resourceFilename
        : resourceFilename === folder ||
            /^(index|styles?)$/.test(resourceFilename)
          ? // if the filename is the same as the folder (i.e. app/app.module.scss)
            resourceFilename
          : // if the filename is not the same as the folder (i.e. app/foo.module.scss)
            `${rel}-${resourceFilename}`;

    return `${prefix}${filename}__${className}__${hash}`;
  };
}

function getCssHash(
  resourcePath: string,
  className: string,
  length: number
): string {
  const hashContent = `filepath:${resourcePath}|classname:${className}`;
  const hash = createHash('md5')
    .update(hashContent)
    .digest('base64')
    // base64 can include "+" and "/" which are not acceptable for css class names
    .replace(/[+]/g, 'x')
    .replace(/[/]/g, 'X');

  return hash.substring(0, length);
}
