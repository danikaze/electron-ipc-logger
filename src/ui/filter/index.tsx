import { Input } from '@headlessui/react';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

import { Checkbox } from '../checkbox';

import styles from './filter.module.scss';

export type Props = {
  placeholder?: string;
  className?: string;
} & (
  | {
      inversable?: false;
      onChange: (text: string) => void;
    }
  | {
      inversable: true;
      onChange: (text: string, inverted: boolean) => void;
    }
);

export const Filter: FC<Props> = ({ placeholder, inversable, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInverted, setInverted] = useState(false);
  const [isFocused, setFocused] = useState(false);
  const [value, setValue] = useState('');

  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);
  const onKeyUp = useCallback((ev) => setValue(ev.target.value), []);
  const clearFilter = useCallback(() => {
    inputRef.current.value = '';
    setValue('');
  }, []);
  const toggleInverted = useCallback(
    () => setInverted((current) => !current),
    []
  );

  useEffect(() => onChange(value, isInverted), [value, isInverted]);

  return (
    <div className={styles.root}>
      <div className={clsx(styles.inputWrapper, isFocused && styles.focused)}>
        <div className={styles.icon}>
          <FilterIcon />
        </div>
        <Input
          ref={inputRef}
          placeholder={placeholder || 'Filter'}
          className={styles.input}
          onKeyUp={onKeyUp}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <div className={styles.icon} title="Clear" onClick={clearFilter}>
          <ClearIcon className={!value && styles.invisible} />
        </div>
      </div>
      {inversable && (
        <Checkbox
          className={styles.invertCb}
          checked={isInverted}
          onChange={toggleInverted}
          title="Inverts the search filter"
        >
          Invert
        </Checkbox>
      )}
    </div>
  );
};

const FilterIcon: FC = () => (
  <svg viewBox="0 0 16 16">
    <path d="M5,3 L12,3 L8,8 L4,3 L5,3 M8,8 L8,13" />
  </svg>
);

const ClearIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 16 16" className={clsx(styles.fill, className)}>
    <mask id="x">
      <rect fill="white" x="0" y="0" width="16" height="16" />
      <path
        fill="black"
        shapeRendering="geometricPrecision"
        d="M4.5,4.5 L10.5,10.5 M4.5,10.5 L10.5,4.5"
      />
    </mask>
    <circle cx="7.5" cy="7.5" r="6" mask="url(#x)" />
  </svg>
);
