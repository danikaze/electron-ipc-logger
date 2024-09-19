import { FC } from 'react';

import { IpcTable } from '../table';
import { useRenderer } from './hooks';

import styles from './renderer.module.scss';

export const Renderer: FC = () => {
  const { logData } = useRenderer();

  return (
    <div className={styles.root}>
      <IpcTable data={logData} />
    </div>
  );
};
