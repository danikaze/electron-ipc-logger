import { FC } from 'react';

import styles from './clear-button.module.scss';

type Props = {
  onClick: () => void;
  title?: string;
};

export const ClearButton: FC<Props> = ({ title, onClick }) => {
  return (
    <div
      title={title || 'Clear message log'}
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
