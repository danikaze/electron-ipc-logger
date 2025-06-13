import { clsx } from 'clsx';
import { FC } from 'react';
import { GetItemString, JSONTree, LabelRenderer } from 'react-json-tree';
import { theme } from './theme';

import styles from './json.module.scss';

export type Props = {
  name?: string;
  data: any;
  className?: string;
};

export const Json: FC<Props> = ({ data, name, className }) => {
  return (
    <div className={clsx(styles.root, className)}>
      <JSONTree
        shouldExpandNodeInitially={(keyPath) => keyPath.length < 3}
        getItemString={createGetItemString(data, name)}
        labelRenderer={getLabelRenderer(name)}
        data={data}
        theme={theme}
      />
    </div>
  );
};

const createGetItemString: (
  rootData: unknown,
  rootName?: string
) => GetItemString =
  (rootData, rootName) => (nodeType, data, itemType, itemString, keyPath) => {
    // this is assigned when a circular element is found
    let circularKey: string | undefined;
    const isCircular = keyPath.some((key, i) => {
      // the first key is the current element and the last one is the root
      if (i === keyPath.length - 1) return false;
      for (let k = keyPath.length - 2; k > 0; k--) {
        const elemKey = keyPath.slice(k);
        const elem = traverse(rootData, elemKey);
        if (elem === data) {
          circularKey = [
            rootName || 'root',
            ...elemKey
              .reverse()
              .splice(1)
              .map((key) => (typeof key === 'number' ? `[${key}]` : `.${key}`)),
          ].join('');
          return true;
        }
      }
    });
    return (
      <span className={styles.itemString}>
        {itemString}
        {isCircular ? (
          <span
            title={`Circular reference to ${circularKey}`}
            className={styles.circular}
          >
            ⭯
          </span>
        ) : null}
      </span>
    );
  };

function getLabelRenderer(name: string): LabelRenderer {
  return (keyPath, nodeType, expanded, expandable) => {
    if (keyPath.length === 1) {
      return <span className={styles.label}>{name}:</span>;
    }
    return <span className={styles.label}>{keyPath[0]}:</span>;
  };
}

/**
 * @param data Object or array to traverse. It expects only traversable data
 * @param path List of keys to traverse, in the same format as provided by
 * `GetItemString`. That is, the 'root' at the end of `path` and the deeper keys
 * as the first elements.
 * @returns Element in the specified `path` of `data`
 */
function traverse(
  data: Readonly<unknown>,
  path: Readonly<(string | number)[]>
): unknown {
  let el = data;
  // ignore the last element because it's `data`
  for (let i = path.length - 2; i >= 0; i--) {
    const key = path[i];
    el = el[key];
  }
  return el;
}
