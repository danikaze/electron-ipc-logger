import { clsx } from 'clsx';
import { FC } from 'react';

import { IpcLogData } from '../../shared';
import { SortableField } from '../types';
import { useIpcTable } from './hooks';
import { MaxLogMsg } from './max-log-msg';
import { IpcRow } from './row';

import styles from './table.module.scss';

export type Props = {
  /** Table container: needed to modify its scroll position */
  containerRef: React.MutableRefObject<HTMLDivElement>;
  /** Needed to auto-scroll */
  lastRowRef: React.MutableRefObject<HTMLTableRowElement>;
  data: ReadonlyArray<IpcLogData>;
  selectedMsg: IpcLogData | undefined;
  sortBy: SortableField;
  sortReverse: boolean;
  relativeTimes: boolean;
  /**
   * `true` when the number of messages received has reached the limit in the
   * options and only the last ones are shown
   */
  logSizeReached: boolean;
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
    lastRowRef,
    activeRowRef,
    selectedMsg,
    relativeTimes,
    sortBy,
    sortReverse,
    logSizeReached,
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
        {logSizeReached && !sortReverse && <MaxLogMsg />}
        {rows.map((row, i) => (
          <IpcRow
            key={row.n}
            odd={i % 2 !== 0}
            data={row}
            active={selectedMsg === row}
            ref={
              i === rows.length - 1
                ? lastRowRef
                : selectedMsg === row
                  ? activeRowRef
                  : undefined
            }
            relativeTimes={relativeTimes}
            onClick={onRowClick}
          />
        ))}
        {logSizeReached && sortReverse && <MaxLogMsg />}
      </tbody>
    </table>
  );
};
