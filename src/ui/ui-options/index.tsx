import { createContext, useContext } from 'react';
import { IpcLoggerUiOptions } from '../../shared';

const UiOptionsContext = createContext<IpcLoggerUiOptions | undefined>(
  undefined
);
UiOptionsContext.displayName = 'UiOptions';

export const UiOptionsProvider = UiOptionsContext.Provider;

export function useUiOptions(): IpcLoggerUiOptions {
  const ctx = useContext(UiOptionsContext);
  if (!ctx) {
    throw new Error('UiOptionsContext not found');
  }
  return ctx;
}
