import clsx from 'clsx';
import { FC, useCallback } from 'react';

import { IpcLogData } from '../../shared';
import { CloseButton } from '../close-button';
import { Json } from '../json';
import { Time } from '../time';
import { TrafficArrow } from '../traffic-arrow';
import { PanelPosition } from '../types';

import styles from './data-panel.module.scss';

export type Props = {
  position: PanelPosition;
  data: IpcLogData | undefined;
  relativeTimes: boolean;
  closePanel: () => void;
  setPanelPosition: (position: PanelPosition) => void;
};

export const DataPanel: FC<Props> = ({
  position,
  data,
  relativeTimes,
  setPanelPosition,
  closePanel,
}) => {
  const movePanelRight = useCallback(
    () => setPanelPosition('right'),
    [setPanelPosition]
  );
  const movePanelBottom = useCallback(
    () => setPanelPosition('bottom'),
    [setPanelPosition]
  );

  return (
    <div className={clsx(styles.root, styles[position])}>
      <div className={styles.topBar}>
        <div className={styles.icons}>
          <div
            title="Dock to bottom"
            className={clsx(
              styles.panelIcon,
              position === 'bottom' && styles.active
            )}
            onClick={movePanelBottom}
          >
            <PanelPositionBottomIcon />
          </div>
          <div
            title="Dock to right"
            className={clsx(
              styles.panelIcon,
              position === 'right' && styles.active
            )}
            onClick={movePanelRight}
          >
            <PanelPositionRightIcon />
          </div>
        </div>
        <CloseButton onClick={closePanel} />
      </div>
      <ul className={styles.meta}>
        <li>
          <strong>Channel:</strong> {data.channel}
        </li>
        <li>
          <strong>Time:</strong> <Time t={data.t} relative={relativeTimes} />
        </li>
        <li>
          <strong>Method</strong> <TrafficArrow msg={data} />
          {data.method}
        </li>
      </ul>
      <div className={styles.json}>
        {data.args.map((arg, i) => (
          <Json key={i} data={arg} name={`args[${i}]`} />
        ))}
      </div>
    </div>
  );
};

const PanelPositionRightIcon: FC = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M2,1 L13,1 L14,2 L14,13 L13,14 L2,14 L1,13 L1,2 L2,1" />
    <path d="M10,1 L10,14" />
  </svg>
);

const PanelPositionBottomIcon: FC = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M2,1 L13,1 L14,2 L14,13 L13,14 L2,14 L1,13 L1,2 L2,1" />
    <path d="M1,10 L14,10" />
  </svg>
);
