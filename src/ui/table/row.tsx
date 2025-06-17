import { clsx } from 'clsx';
import { forwardRef, MouseEvent, useCallback } from 'react';

import { IpcLogData } from '../../shared';
import { safeJsonStringify } from '../json/safe-json';
import { Time } from '../time';
import { TrafficArrow } from '../traffic-arrow';

import styles from './table.module.scss';

export type Props = {
  data: IpcLogData;
  odd: boolean;
  relativeTimes: boolean;
  active: boolean;
  onClick: (n: IpcLogData['n']) => void;
};

export const IpcRow = forwardRef<HTMLTableRowElement, Props>(
  ({ data, odd, relativeTimes, active, onClick }, ref) => {
    const clickHandler = useCallback(
      (ev: MouseEvent) => {
        let elem = ev.target as HTMLElement;
        while (elem.dataset.n === undefined && elem.parentElement) {
          elem = elem.parentElement;
        }
        if (elem.dataset) {
          onClick(Number(elem.dataset.n));
        }
      },
      [onClick]
    );

    return (
      <tr
        ref={ref}
        data-n={data.n}
        onClick={clickHandler}
        className={clsx(odd && styles.odd, active && styles.active)}
      >
        <td className={styles.colN}>{data.n}</td>
        <td className={styles.colT}>
          <Time t={data.t} relative={relativeTimes} />
        </td>
        <td className={styles.colMethod}>
          <TrafficArrow msg={data} />
          {data.method}
        </td>
        <td className={styles.colChannel}>{data.channel}</td>
        <td className={styles.colArgs}>{safeJsonStringify(data.args)}</td>
      </tr>
    );
  }
);
