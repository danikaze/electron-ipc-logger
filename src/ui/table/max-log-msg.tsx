import { FC } from 'react';

import { useUiOptions } from '../ui-options';

import styles from './table.module.scss';

export const MaxLogMsg: FC = () => {
  const { logSize } = useUiOptions();

  return (
    <tr className={styles.maxLog}>
      <td colSpan={5}>
        Data trimmed to the last <code>{logSize}</code>{' '}
        {logSize === 1 ? 'message' : 'messages'}. This limit can be changed with
        the <code>logSize</code> option.
      </td>
    </tr>
  );
};
