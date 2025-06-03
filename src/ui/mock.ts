import type { IpcRenderer } from 'electron';
import {
  API_NAMESPACE,
  IpcLoggerApi,
  IpcLogData,
  IpcLoggerUiOptions,
  IPC_CHANNEL,
} from '../shared';

(() => {
  /*
   * This file is only executed on development mode, providing mock data to test
   * the extension UI
   */
  if (process.env.BUILD_MODE !== 'development') {
    return;
  }

  const startTime = Date.now();
  const mockData: Omit<IpcLogData, 'n'>[] = [
    { t: startTime + 10, channel: 'channel1', method: 'on', args: [] },
    { t: startTime + 12, channel: 'channel1', method: 'on', args: [] },
    {
      t: startTime + 15,
      channel: 'Readfile-Request',
      method: 'on',
      args: [
        {
          key: 'd8f564de-dbf9-4f85-b51b-bcc0d314822c',
          filename: 'resources/locales/en/test-app.json',
        },
      ],
    },
    {
      t: startTime + 20,
      channel: 'Readfile-Response',
      method: 'send',
      args: [
        {
          key: 'd8f564de-dbf9-4f85-b51b-bcc0d314822c',
          error: null,
          data: '{\n  "main": "Message used from main process",\n…c": "Fonts of different types can be used"\n}\n',
        },
      ],
    },
    {
      t: startTime + 1200,
      channel: 'data-types',
      method: 'on',
      args: [
        {
          int: 123,
          float: 123.456,
          str: 'String',
          null: null,
          undefined: undefined,
          sumFn: (a: number, b: number) => a + b,
          obj: { a: 1, s: 'str' },
          arr: [
            1,
            2,
            3.456,
            'str',
            ['x', 'y'],
            { foo: 1, bar: 2 },
            null,
            undefined,
          ],
        },
      ],
    },
    {
      t: startTime + 2500,
      channel: 'multiple-args',
      method: 'handleOnce',
      args: [
        123,
        {
          obj: 'a',
          inner: { b: 'str' },
        },
        'string',
        ['array', 'foo', 'bar'],
      ],
    },
    { t: startTime + 100_000, channel: '> 1 min', method: 'on', args: [] },
    {
      t: startTime + 2_000_000,
      channel: 'with return',
      method: 'handle',
      result: 123,
      args: ['x', 'y', 'z'],
    },
    { t: startTime + 4_000_000, channel: '> 1 h', method: 'on', args: [] },
  ];
  const logData = mockData.map((ev, i) => ({ n: i + 1, ...ev }));

  const uiOptions: IpcLoggerUiOptions = {
    logSize: 20,
  };

  const api: IpcLoggerApi = {
    startTime,
    isMac: false,
    ipcRenderer: {
      invoke: (async (channel: string, op: string) => {
        // on any other channel, doesn't resolve
        if (channel !== IPC_CHANNEL) return new Promise(() => {});
        if (op === 'getOptions') return uiOptions;
        throw new Error(`Unknown op "${op}"`);
      }) as IpcRenderer['invoke'],
    } as IpcRenderer,
    onUpdate: (cb) => cb(logData),
  };
  (window as any)[API_NAMESPACE] = api;
})();
