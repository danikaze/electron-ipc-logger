import { join } from 'path';

export function getAbsolutePath(...path: string[]): string {
  return join(__dirname, '..', '..', ...path);
}
