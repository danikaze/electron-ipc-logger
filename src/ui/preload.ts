import { contextBridge, ipcRenderer } from 'electron';
import {
  API_NAMESPACE,
  IpcLoggerApi,
  IpcLogData,
  IPC_CHANNEL,
  IpcLoggerMsg,
  IpcLoggerMsgNewLog,
  IpcLoggerMsgUpdateResult,
} from '../shared';

// Used to calculate the relative time of an event
const startTime = Date.now();

type ControlData = {
  listener: (event: Electron.IpcRendererEvent, data: IpcLoggerMsg) => void;
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
function installRendererIpcLogger(): void {
  if (control) return;

  const logData: IpcLogData[] = [];
  const listeners: ((cb: ReadonlyArray<IpcLogData>) => void)[] = [];

  const onUpdate: IpcLoggerApi['onUpdate'] = (cb) => {
    listeners.push(cb);

    // send the initial data so nothing is missed
    if (logData.length > 0) {
      cb(logData);
    }
  };

  const listener: ControlData['listener'] = (ev, msg) => {
    if (isNewLogMsg(msg)) {
      logData.push(msg.log);
    } else if (isUpdateResultMsg(msg)) {
      const log = logData.findLast((log) => log.n === msg.n);
      if (!log) return;
      log.result = msg.result;
    } else {
      console.warn(`Unknown IpcLoggerMsg:`, msg);
      return;
    }

    for (const listener of listeners) {
      // maybe it would be better to send only the new data instead of
      // everything? ... but it works now and this is simpler :)
      listener(logData);
    }
  };

  const api: IpcLoggerApi = {
    startTime,
    onUpdate,
    ipcRenderer,
  };

  control = {
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

  control.api.ipcRenderer.on(IPC_CHANNEL, listener);
}

function isNewLogMsg(msg: IpcLoggerMsg): msg is IpcLoggerMsgNewLog {
  return (msg as IpcLoggerMsgNewLog).log !== undefined;
}

function isUpdateResultMsg(msg: IpcLoggerMsg): msg is IpcLoggerMsgUpdateResult {
  return (msg as IpcLoggerMsgUpdateResult).n !== undefined;
}
