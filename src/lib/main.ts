import {
  app,
  BrowserWindow,
  ipcMain,
  IpcMain,
  IpcMainEvent,
  IpcMainInvokeEvent,
  WebContents,
} from 'electron';

import type {
  IpcLogData,
  IpcLoggerMsgNewLog,
  IpcLoggerMsgUpdateResult,
  IpcLoggerOptions,
} from '../shared';
import { DEFAULT_OPTIONS, IPC_CHANNEL, isSystemChannel } from '../shared';
import { getUiWindow } from './window';

type LogEventFn = {
  (
    dataToLog: Omit<IpcLogData, 't' | 'n' | 'result' | 'method'> & {
      method: Exclude<IpcLogData['method'], 'handle' | 'handleOnce'>;
    },
    event?: IpcMainEvent
  ): void;
  (
    dataToLog: Omit<IpcLogData, 't' | 'n' | 'result' | 'method'> & {
      method: 'handle' | 'handleOnce';
    },
    event: IpcMainInvokeEvent
  ): (result: any) => void;
};

let isInstalled = false;
let nEventsLogged = 0;

const originalMethods = {
  handle: ipcMain.handle,
  handleOnce: ipcMain.handleOnce,
  on: ipcMain.on,
  once: ipcMain.once,
  removeAllListeners: ipcMain.removeAllListeners,
  removeHandler: ipcMain.removeHandler,
  removeListener: ipcMain.removeListener,
};

/*
 * This map is needed to know which listener to remove when calling `remove*`,
 * since the original listener is wrapped with the logging function.
 */
const originalToHijacked = new Map();

/**
 * This map is needed to _uninstall_ the hijacked listeners on windows (on the
 * global `ipcMain` there's no need because they are static and always known)
 */
const hijackedWebContents: {
  webContents: WebContents;
  send: WebContents['send'];
}[] = [];

/**
 * Install the IpcLogger in the application to intercept IPC messages and
 * display them in a window for debugging.
 *
 * @param options Configurable behavior
 * @returns `BrowserWindow` for the IpcLogger UI
 */
export async function installIpcLogger(
  options?: IpcLoggerOptions & { disabled?: false }
): Promise<BrowserWindow>;
/**
 * Allows to preserve the IpcLogger configuration code but does nothing.
 * It doesn't return the window as it's not created when disabled.
 *
 * @param options Configurable behavior with `disabled` option
 * @returns undefined
 */
export async function installIpcLogger(
  options: IpcLoggerOptions & { disabled: true }
): Promise<undefined>;
/**
 * Install the IpcLogger in the application to intercept IPC messages and
 * display them in a window for debugging.
 *
 * @param options Configurable behavior
 * @returns `BrowserWindow` for the IpcLogger UI, or `undefined` when disabled
 */
export async function installIpcLogger(
  options?: IpcLoggerOptions
): Promise<BrowserWindow>;
export async function installIpcLogger(
  options?: IpcLoggerOptions
): Promise<BrowserWindow | undefined> {
  const opt = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  if (opt.disable) return;

  if (isInstalled) {
    throw new Error(
      [
        'IpcLogger is already installed.',
        'Dont call installIpcLogger multiple times',
        '(without calling uninstallIpcLogger)',
      ].join(' ')
    );
  }
  isInstalled = true;

  const uiWindow = await getUiWindow(options.parent);
  const logEvent = getLogger(opt, uiWindow.webContents);

  hijackIpcMain(opt, logEvent);

  // hijack current open windows
  for (const window of BrowserWindow.getAllWindows()) {
    hijackWindow(opt, logEvent, window.webContents);
  }

  // hijack future opened windows
  app.on('browser-window-created', (event, window) => {
    hijackWindow(opt, logEvent, window.webContents);
  });

  if (opt.openUiOnStart !== false) {
    uiWindow.show();
  }

  return uiWindow;
}

/**
 *
 * @param options
 * @param logEvent
 */
function hijackIpcMain(options: IpcLoggerOptions, logEvent: LogEventFn): void {
  const { rendererToMain, mainToRenderer } = options;

  const originalBinded = {
    handle: ipcMain.handle.bind(ipcMain),
    handleOnce: ipcMain.handleOnce.bind(ipcMain),
    on: ipcMain.on.bind(ipcMain),
    once: ipcMain.once.bind(ipcMain),
    removeAllListeners: ipcMain.removeAllListeners.bind(ipcMain),
    removeHandler: ipcMain.removeHandler.bind(ipcMain),
    removeListener: ipcMain.removeListener.bind(ipcMain),
  };

  if (rendererToMain) {
    ipcMain.handle = (
      channel: string,
      listener: (
        event: IpcMainInvokeEvent,
        ...args: any[]
      ) => Promise<any> | any
    ): void => {
      const listenerWithLog = async (
        event: IpcMainInvokeEvent,
        ...args: any[]
      ): Promise<any> => {
        const updateResult = logEvent(
          { method: 'handle', channel, args },
          event
        );
        const result = await listener(event, ...args);
        updateResult(result);
        return result;
      };
      originalToHijacked.set(listener, listenerWithLog);

      return originalBinded.handle(channel, listenerWithLog);
    };

    ipcMain.handleOnce = (
      channel: string,
      listener: (
        event: IpcMainInvokeEvent,
        ...args: any[]
      ) => Promise<any> | any
    ): void => {
      const listenerWithLog = async (
        event: IpcMainInvokeEvent,
        ...args: any[]
      ): Promise<any> => {
        const updateResult = logEvent(
          { method: 'handleOnce', channel, args },
          event
        );
        const result = await listener(event, ...args);
        updateResult(result);
        return result;
      };
      originalToHijacked.set(listener, listenerWithLog);

      return originalBinded.handleOnce(channel, listenerWithLog);
    };
  }

  if (mainToRenderer) {
    ipcMain.on = (
      channel: string,
      listener: (event: IpcMainEvent, ...args: any[]) => void
    ): IpcMain => {
      const listenerWithLog = (event: IpcMainEvent, ...args: any[]): void => {
        logEvent({ method: 'on', channel, args }, event);
        listener(event, ...args);
      };
      originalToHijacked.set(listener, listenerWithLog);

      return originalBinded.on(channel, listenerWithLog);
    };

    ipcMain.once = (
      channel: string,
      listener: (event: IpcMainEvent, ...args: any[]) => void
    ): IpcMain => {
      const listenerWithLog = (event: IpcMainEvent, ...args: any[]): void => {
        logEvent({ method: 'once', channel, args }, event);
        listener(event, ...args);
      };
      originalToHijacked.set(listener, listenerWithLog);

      return originalBinded.once(channel, listenerWithLog);
    };
  }

  ipcMain.removeListener = (
    channel: string,
    listener: (...args: any[]) => void
  ): IpcMain => {
    const listenerWithLog = originalToHijacked.get(listener);
    return ipcMain.removeListener(channel, listenerWithLog);
  };
}

/**
 *
 * @param options
 * @param logEvent
 * @param webContents
 * @returns
 */
function hijackWindow(
  options: IpcLoggerOptions,
  logEvent: LogEventFn,
  webContents: WebContents
): void {
  const { mainToRenderer } = options;
  if (!mainToRenderer) return;

  const originalSend = webContents.send.bind(webContents);
  const hijackedSend = (channel: string, ...args: any[]): void => {
    logEvent({ method: 'send', channel, args });
    return originalSend(channel, ...args);
  };
  hijackedWebContents.push({ webContents, send: webContents.send });
  webContents.send = hijackedSend;
}

/**
 *
 * @param options
 * @param uiWebContents
 * @returns
 */
function getLogger(
  options: Pick<
    IpcLoggerOptions,
    'consoleOutput' | 'logSystemMessages' | 'onIpcMessage' | 'filter'
  >,
  uiWebContents: WebContents
): LogEventFn {
  const { logSystemMessages, filter, onIpcMessage, consoleOutput } = options;

  return (
    dataToLog: Omit<IpcLogData, 't' | 'n' | 'result'>,
    event: IpcMainEvent | IpcMainInvokeEvent
  ) => {
    // IPC filtering
    if (
      dataToLog.channel === IPC_CHANNEL ||
      (!logSystemMessages && isSystemChannel(dataToLog.channel))
    ) {
      return;
    }

    const data: IpcLogData = {
      t: Date.now(),
      n: ++nEventsLogged,
      ...dataToLog,
    };

    if (filter && !filter(data)) return;

    // data augmentation
    if (event?.sender?.id) {
      data.senderId = event.sender.id;
    }
    if (event?.frameId) {
      data.frameId = event.frameId;
    }

    // custom callback inside main
    onIpcMessage && onIpcMessage(data.channel, ...data.args);

    // console log
    if (consoleOutput) {
      logInConsole(data);
    }

    // send the data to the UI
    const msg: IpcLoggerMsgNewLog = { log: data };
    uiWebContents.send(IPC_CHANNEL, msg);

    // if it's called via handle*, provide a way to update the result
    if (data.method !== 'handle' && data.method !== 'handleOnce') return;
    return (result: any) => {
      const msg: IpcLoggerMsgUpdateResult = { n: data.n, result };
      uiWebContents.send(IPC_CHANNEL, msg);
    };
  };
}

/**
 *
 */
function logInConsole(data: IpcLogData): void {
  const senderId = data.senderId ?? 'unknown';
  const frameId = data.frameId ?? 'unknown';

  console.log(
    `[IPC](${data.method}) ${senderId} -> ${frameId} ${data.channel}`,
    ...data.args
  );
}
