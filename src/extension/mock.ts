import type { IpcRenderer } from 'electron';
import { API_NAMESPACE, IpcLoggerApi, LogData } from '../shared';

(() => {
  /*
   * This file is only executed on development mode, providing mock data to test
   * the extension UI
   */
  if (process.env.NODE_ENV === 'production') return;

  const API_READY_DELAY = 0;

  const createPanel: typeof chrome.devtools.panels.create = (
    title,
    iconPath,
    pagePath,
    callback
  ) => {
    callback({} as chrome.devtools.panels.ExtensionPanel);
  };

  (window as any).chrome = {
    devtools: {
      panels: {
        create: createPanel,
      },
    },
  };

  const startTime = Date.now();
  const logData: LogData[] = [
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
  ];

  setTimeout(() => {
    const api: IpcLoggerApi = {
      startTime,
      ipcRenderer: {} as IpcRenderer,
      onUpdate: (cb) => cb(logData),
    };
    (window as any)[API_NAMESPACE] = api;
  }, API_READY_DELAY);
})();
