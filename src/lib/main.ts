import {
  BrowserWindow,
  ipcMain,
  IpcMain,
  IpcMainEvent,
  IpcMainInvokeEvent,
  session,
  WebContents,
} from 'electron';

import type { LogData, LogIpcMessagesOptions } from '../shared';
import { DEFAULT_OPTIONS, isSystemChannel } from '../shared';
import { getAbsolutePath } from './utils/get-absolute-path';

const originalMethods = {
  handle: ipcMain.handle,
  handleOnce: ipcMain.handleOnce,
  on: ipcMain.on,
  once: ipcMain.once,
  removeAllListeners: ipcMain.removeAllListeners,
  removeHandler: ipcMain.removeHandler,
  removeListener: ipcMain.removeListener,
};

const installedWindowsSend: WebContents['send'][] = [];

export async function installMainIpcLogger(
  options?: LogIpcMessagesOptions
): Promise<void> {
  const { disable, mainToRenderer, rendererToMain, ...loggerOptions } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  if (disable) return;

  await installExtension(options.extensionPath);

  const originalBinded = {
    handle: ipcMain.handle.bind(ipcMain),
    handleOnce: ipcMain.handleOnce.bind(ipcMain),
    on: ipcMain.on.bind(ipcMain),
    once: ipcMain.once.bind(ipcMain),
    removeAllListeners: ipcMain.removeAllListeners.bind(ipcMain),
    removeHandler: ipcMain.removeHandler.bind(ipcMain),
    removeListener: ipcMain.removeListener.bind(ipcMain),
  };

  const logEvent = getLogger(loggerOptions);

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
        const result = await listener(event, ...args);
        logEvent({ method: 'handle', channel, args, result }, event);
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
        const result = await listener(event, ...args);
        logEvent({ method: 'handleOnce', channel, args, result }, event);
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
        listener(event, ...args);
        logEvent({ method: 'on', channel, args }, event);
      };
      originalToHijacked.set(listener, listenerWithLog);

      return originalBinded.on(channel, listenerWithLog);
    };

    ipcMain.once = (
      channel: string,
      listener: (event: IpcMainEvent, ...args: any[]) => void
    ): IpcMain => {
      const listenerWithLog = (event: IpcMainEvent, ...args: any[]): void => {
        listener(event, ...args);
        logEvent({ method: 'once', channel, args }, event);
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

export function uninstallMainIpcLogger(): void {
  ipcMain.handle = originalMethods.handle;
  ipcMain.handleOnce = originalMethods.handleOnce;
  ipcMain.on = originalMethods.on;
  ipcMain.once = originalMethods.once;
  ipcMain.removeListener = originalMethods.removeListener;
}

export function installWindowIpcLogger(
  window: BrowserWindow,
  options?: LogIpcMessagesOptions
): void {
  const { disable, mainToRenderer, ...loggerOptions } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  if (disable || !mainToRenderer) return;
  const logEvent = getLogger(loggerOptions);

  const { webContents } = window;
  const originalSend = webContents.send.bind(webContents);
  const hijackedSend = (channel: string, ...args: any[]): void => {
    logEvent({ method: 'send', channel, args });
    return originalSend(channel, ...args);
  };
  hijackedToOriginal.set(hijackedSend, webContents.send);
  webContents.send = hijackedSend;
  installedWindowsSend.push(originalSend);
}

export function uninstallWindowIpcLogger(window: BrowserWindow): void {
  const originalSend = hijackedToOriginal.get(window.webContents.send);
  if (!originalSend) return;

  window.webContents.send = originalSend;

  const i = installedWindowsSend.findIndex(originalSend);
  if (i !== -1) {
    installedWindowsSend.splice(i, 1);
  }
}

const getLogger =
  (
    options: Pick<
      LogIpcMessagesOptions,
      | 'consoleOutput'
      | 'logSystemMessages'
      | 'onIpcMessage'
      | 'filter'
      | 'ipcChannel'
    >
  ) =>
  (
    dataToLog: Omit<LogData, 't'>,
    event?: IpcMainEvent | IpcMainInvokeEvent
  ): void => {
    const {
      logSystemMessages,
      filter,
      onIpcMessage,
      consoleOutput,
      ipcChannel,
    } = options;

    // IPC filtering
    if (
      dataToLog.channel === ipcChannel ||
      (!logSystemMessages && isSystemChannel(dataToLog.channel))
    ) {
      return;
    }

    const data: LogData = {
      t: Date.now(),
      ...dataToLog,
    };

    if (filter && !filter(data)) return;

    // data augmentation
    if (event?.sender?.id) {
      dataToLog.senderId = event.sender.id;
    }
    if (event?.frameId) {
      dataToLog.frameId = event.frameId;
    }

    // custom callback inside main
    onIpcMessage && onIpcMessage(dataToLog.channel, ...dataToLog.args);

    // console log
    if (consoleOutput) {
      logInConsole(data);
    }

    // broadcast to windows via custom IPC
    for (const send of installedWindowsSend) {
      send(ipcChannel, dataToLog);
    }
  };

function logInConsole(data: LogData): void {
  const senderId = data.senderId ?? 'unknown';
  const frameId = data.frameId ?? 'unknown';

  console.log(
    `[IPC](${data.method}) ${senderId} -> ${frameId} ${data.channel}`,
    ...data.args
  );
}

/*
 * This map is needed to know which listener to remove when calling `remove*`,
 * since the original listener is wrapped with the logging function.
 */
const originalToHijacked = new Map();

/**
 * This map is needed to _uninstall_ the hijacked listeners on windows (on the
 * global `ipcMain` there's no need because they are known)
 */
const hijackedToOriginal = new Map();

/**
 * Installs the Chrome extension provided with the package to have a new panel
 * available in the devTools, to visualize the IPC messages flow
 */
async function installExtension(from: string | undefined): Promise<void> {
  const extensionPath = from ?? getAbsolutePath('dist', 'extension');
  await session.defaultSession.loadExtension(extensionPath);
}
