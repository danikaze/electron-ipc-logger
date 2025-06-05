import { IpcLogData } from '../../shared';
import { safeJsonStringify } from '../json/safe-json';
import { SortableField } from '../types';

export function filterAndSort(
  data: IpcLogData[],
  [filter, filterInverted]: [string, boolean],
  [sortBy, sortReverse]: [SortableField, boolean]
): IpcLogData[] {
  const ciFilter = filter.toLocaleLowerCase();
  const rows = !filter
    ? [...data]
    : data.filter((row) => {
        const res =
          row.channel.toLocaleLowerCase().includes(ciFilter) ||
          row.args?.filter(Boolean).some((arg) =>
            safeJsonStringify(arg).toLocaleLowerCase().includes(filter)
          );
        return filterInverted ? !res : res;
      });

  if (sortBy !== 'n') {
    rows.sort(SORT_BY[sortBy]);
  }

  if (sortReverse) {
    rows.reverse();
  }

  return rows;
}

const SORT_BY: Record<
  Exclude<SortableField, 'n'>,
  (a: IpcLogData, b: IpcLogData) => number
> = {
  t: function (a: IpcLogData, b: IpcLogData): number {
    const res = a.t - b.t;
    if (res !== 0) return res;
    return a.n - b.n;
  },
  method: function (a: IpcLogData, b: IpcLogData): number {
    const res = a.method.localeCompare(b.method);
    if (res !== 0) return res;
    return a.n - b.n;
  },
  channel: function (a: IpcLogData, b: IpcLogData): number {
    const res = a.channel.localeCompare(b.channel);
    if (res !== 0) return res;
    return a.n - b.n;
  },
};
