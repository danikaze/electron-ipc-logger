import { FC } from 'react';

import { BarSeparator } from '../bar-separator';
import { Checkbox } from '../checkbox';
import { ClearButton } from '../clear-button';
import { Filter } from '../filter';

import styles from './top-bar.module.scss';

export type Props = {
  relativeTimes: boolean;
  onUseRelativeTimes: (relative?: boolean) => void;
  setFilter: (filter: string) => void;
  clearMessages: () => void;
};

export const TopBar: FC<Props> = ({
  relativeTimes,
  onUseRelativeTimes,
  setFilter,
  clearMessages,
}) => {
  return (
    <div className={styles.root}>
      <ClearButton onClick={clearMessages} />
      <Filter inversable onChange={setFilter} />
      <BarSeparator />
      <Checkbox
        title="Toggle between absolute and relative times display"
        checked={relativeTimes}
        onChange={onUseRelativeTimes}
      >
        Relative times
      </Checkbox>
    </div>
  );
};
