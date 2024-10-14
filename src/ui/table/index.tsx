import { clsx } from 'clsx';
import { FC, cloneElement } from 'react';

import { IpcLogData } from '../../shared';
import { SortableField } from '../types';
import { useIpcTable } from './hooks';
import { IpcRow } from './row';

import styles from './table.module.scss';

export type Props = {
  data: ReadonlyArray<IpcLogData>;
  selectedMsg: IpcLogData | undefined;
  sortBy: SortableField;
  sortReverse: boolean;
  filter: string;
  filterInverted: boolean;
  relativeTimes: boolean;
  className?: string;
  onRowClick: (n: IpcLogData['n']) => void;
  setSortBy: (field: SortableField) => void;
};

/**
 * Table showing the list of captured messages
 */
export const IpcTable: FC<Props> = ({ className, ...props }) => {
  const {
    rows,
    selectedMsg,
    relativeTimes,
    sortBy,
    sortReverse,
    onRowClick,
    sortByN,
    sortByTime,
    sortByMethod,
    sortByChannel,
  } = useIpcTable(props);

  const sortArrow = (
    <div className={styles.sortArrow}>{sortReverse ? '▼' : '▲'}</div>
  );

  return (
    <table className={clsx(styles.root, className)}>
      <thead className={className}>
        <tr>
          <th
            title="Incremental unique identifier"
            onClick={sortByN}
            className={clsx(styles.colN)}
          >
            <div>N{sortBy === 'n' && sortArrow}</div>
          </th>
          <th
            title="Time when the IPC message happened"
            onClick={sortByTime}
            className={clsx(styles.colT)}
          >
            <div>
              Time
              {sortBy === 't' && sortArrow}
            </div>
          </th>
          <th
            title="Method that handled the IPC message on the main process"
            onClick={sortByMethod}
            className={clsx(styles.colMethod)}
          >
            <div>
              Method
              {sortBy === 'method' && sortArrow}
            </div>
          </th>
          <th
            title="Channel used to transmite the IPC message"
            onClick={sortByChannel}
            className={clsx(styles.colChannel)}
          >
            <div>
              Channel
              {sortBy === 'channel' && sortArrow}
            </div>
          </th>
          <th
            title="Data included in the IPC message parameters"
            className={styles.colArgs}
          >
            <div>Data</div>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <IpcRow
            key={row.n}
            odd={i % 2 !== 0}
            data={row}
            active={selectedMsg === row}
            relativeTimes={relativeTimes}
            onClick={onRowClick}
          />
        ))}
      </tbody>
    </table>
  );
};
