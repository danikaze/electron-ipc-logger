import { FC } from 'react';

import { useRenderer } from './hooks';

import styles from './renderer.module.scss';

export type Props = {
  errors: string[];
};

export const Renderer: FC<Props> = ({ errors }) => {
  const { isReady, logData } = useRenderer();

  return (
    <div className={styles.root}>
      {/* <IpcTable data={logData} /> */}
      RENDERER {isReady ? 'ready' : 'not ready'}
      <pre>{JSON.stringify(logData)}</pre>
      <pre>Errors: {errors}</pre>
    </div>
  );
};
