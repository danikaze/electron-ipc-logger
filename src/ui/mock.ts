import {
  API_NAMESPACE,
  IpcLogData,
  IpcLoggerApi,
  IpcLoggerUiOptions,
} from '../shared';

(() => {
  /*
   * This file is only executed on development mode, providing mock data to test
   * the extension UI
   */
  if (process.env.BUILD_MODE !== 'development') {
    return;
  }

  const startTime = Date.now() - 4_000_000;
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
    {
      t: startTime + 3_000_000,
      channel: 'cyclic data',
      method: 'on',
      args: (() => {
        const obj = {
          arr: [{ a: 1 }, 2, {}] as unknown[],
          n: 123,
          str: 'x',
          o: undefined,
        };
        obj.o = obj;
        obj.arr[2] = obj;
        return [obj];
      })(),
    },
    { t: startTime + 4_000_000, channel: '> 1 h', method: 'on', args: [] },
  ];
  const preLogData = mockData.map((ev, i) => ({ n: i + 1, ...ev }));

  const uiOptions: IpcLoggerUiOptions = {
    logSize: 20,
  };

  const api: IpcLoggerApi = {
    startTime,
    isMac: false,
    getOptions: () => Promise.resolve(uiOptions),
    onUpdate: (cb) => {
      let lastN = Math.max(...preLogData.map((msg) => msg.n));
      (window as any).update = (data: ReadonlyArray<IpcLogData>) => {
        if (!data) {
          const code = 'font-family:monospace;color:grey;';
          const normal = 'font-family:revert;color:revert;';
          console.warn(
            [
              'This methods simulates an incoming message via the IPC channel.',
              '',
              '    Usage:',
              '      %cwindow.update(newMessages)%c',
              '',
              '    where %cnewMessages%c is a an array like %cIpcLogData[]%c:',
              '      %cwindow.update([{',
              '        t: Date.now(),',
              '        n: 1234,',
              `        method: 'send',`,
              `        channel: 'CHANNEL_NAME',`,
              '        args: [1, 2, 3]',
              '      }])%c',
            ].join('\n'),
            code,
            normal,
            code,
            normal,
            code,
            normal,
            code,
            normal
          );
          return;
        }
        // messages normalization for easier debugging
        const msgs = Array.isArray(data) ? data : [data];
        for (const msg of msgs) {
          // accept default parameters for non-update messages
          // (so result messages don't overwrite the time unless explicitly specified)
          if (msg.result === undefined) {
            // no need to specify `t` (by default `Date.now()`)
            if (msg.t === undefined) {
              msg.t = Date.now();
            }
            // no need to specify `n` (auto-increment)
            if (msg.n === undefined) {
              msg.n = ++lastN;
            } else {
              lastN = Math.max(lastN, msg.n);
            }
          }
        }
        cb(msgs);
      };
      cb(preLogData);
    },
  };
  (window as any)[API_NAMESPACE] = api;
})();
