import { FC } from 'react';

import styles from './clear-button.module.scss';
import { API_NAMESPACE, IpcLoggerApi } from '../../shared';

type Props = {
  onClick: () => void;
  title?: string;
};

const api = window[API_NAMESPACE] as IpcLoggerApi;

export const ClearButton: FC<Props> = ({ title, onClick }) => {
  const shortcut = api.isMac ? '⌘ + L' : 'Ctrl + L';
  return (
    <div
      title={title || `Clear message log ー ${shortcut}`}
      className={styles.button}
      onClick={onClick}
    >
      <svg viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" />
        <path d="M3 15L15 3" />
      </svg>
    </div>
  );
};
