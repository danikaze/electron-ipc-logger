import { resolve } from 'path';

export function getAbsolutePath(...path: string[]): string {
  return resolve('node_modules', 'electron-ipc-logger', ...path);
}
