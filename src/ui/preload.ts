import { contextBridge, ipcRenderer } from 'electron';
import {
  API_NAMESPACE,
  DEFAULT_OPTIONS,
  IpcLoggerApi,
  LogData,
  LogIpcMessagesOptions,
} from '../shared';

// Used to calculate the relative time of an event
const startTime = Date.now();

type LogIpcMessagesOptionsPreload = Pick<LogIpcMessagesOptions, 'ipcChannel'>;

type ControlData = LogIpcMessagesOptionsPreload & {
  listener: (event: Electron.IpcRendererEvent, data: LogData) => void;
  api: IpcLoggerApi;
};

/**
 * Options passed when installing the logger
 * Set to `undefined` again once uninstalled
 */
let control: ControlData | undefined;

installRendererIpcLogger();

/**
 *
 * @param options
 */
function installRendererIpcLogger(
  options?: LogIpcMessagesOptionsPreload
): void {
  if (control) return;

  const logData: LogData[] = [];
  const listeners: ((cb: ReadonlyArray<LogData>) => void)[] = [];
  const { ipcChannel } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const onUpdate: IpcLoggerApi['onUpdate'] = (cb) => {
    listeners.push(cb);

    // send the initial data so nothing is missed
    if (logData.length > 0) {
      cb(logData);
    }
  };

  const listener: ControlData['listener'] = (ev, data) => {
    logData.push(data);

    for (const listener of listeners) {
      listener(logData);
    }
  };

  const api: IpcLoggerApi = {
    startTime,
    onUpdate,
    ipcRenderer,
  };

  control = {
    ipcChannel,
    listener,
    api,
  };

  // Use `contextBridge` APIs to expose Electron APIs to
  // renderer only if context isolation is enabled, otherwise
  // just add to the DOM global.
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld(API_NAMESPACE, api);
    } catch (error) {
      console.error(error);
    }
  } else {
    window[API_NAMESPACE] = api;
  }

  control.api.ipcRenderer.on(ipcChannel, listener);
}

function uninstallRendererIpcLogger(): void {
  if (!control) return;

  const { ipcChannel, listener } = control;

  if (!process.contextIsolated) {
    delete window[API_NAMESPACE];
  }

  control.api.ipcRenderer.off(ipcChannel, listener);

  control = undefined;
}
