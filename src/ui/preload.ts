import { contextBridge, ipcRenderer } from 'electron';
import {
  API_NAMESPACE,
  IPC_CHANNEL,
  IpcLogData,
  IpcLoggerApi,
  IpcLoggerEvents,
  IpcLoggerMsgEventLog,
  IpcLoggerEventUpdateResult,
} from '../shared';

// Used to calculate the relative time of an event
const startTime = Date.now();

type ControlData = {
  listener: (event: Electron.IpcRendererEvent, data: IpcLoggerEvents) => void;
  api: IpcLoggerApi;
};

type UiListenerData = {
  /** Function to send the new messages */
  cb: (cb: ReadonlyArray<IpcLogData>) => void;
  /** Last message sent to that listener */
  last: IpcLogData['n'];
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
  const listeners: UiListenerData[] = [];

  const onUpdate: IpcLoggerApi['onUpdate'] = (cb) => {
    listeners.push({
      cb,
      last: logData[logData.length - 1]?.n || 0,
    });

    // send the initial data so nothing is missed
    if (logData.length > 0) {
      cb(logData);
    }
  };

  const listener: ControlData['listener'] = (ev, msg) => {
    // keep track of updated messages because they are always sent, even if they
    // are "older" than the last one sent to UI clients
    const updatedMsgs: IpcLogData[] = [];

    if (isNewLogMsg(msg)) {
      logData.push(msg.log);
    } else if (isUpdateResultMsg(msg)) {
      const log = logData.findLast((log) => log.n === msg.n);
      if (!log) return;
      log.result = msg.result;
      updatedMsgs.push(log);
    } else {
      console.warn(`Unknown IpcLoggerMsg:`, msg);
      return;
    }

    for (const uiListener of listeners) {
      // The data sent to the listener is only new data (to avoid sending
      // hundreds or thousands when time passes) + updated data (which
      // always is sent, so it can be also updated on the UI)
      const newData = logData.filter((data) => data.n > uiListener.last);
      const sentData = [...updatedMsgs, ...newData];
      uiListener.cb(sentData);
      uiListener.last = Math.max(...sentData.map((row) => row.n)) + 1;
    }
  };

  const api: IpcLoggerApi = {
    startTime,
    onUpdate,
    getOptions: () => ipcRenderer.invoke(IPC_CHANNEL, 'getOptions'),
    isMac: process.platform === 'darwin',
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

  ipcRenderer.on(IPC_CHANNEL, listener);
}

function isNewLogMsg(msg: IpcLoggerEvents): msg is IpcLoggerMsgEventLog {
  return (msg as IpcLoggerMsgEventLog).log !== undefined;
}

function isUpdateResultMsg(
  msg: IpcLoggerEvents
): msg is IpcLoggerEventUpdateResult {
  return (msg as IpcLoggerEventUpdateResult).n !== undefined;
}
