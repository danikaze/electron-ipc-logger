import { BrowserWindow } from 'electron';
import type { IpcRenderer } from 'electron/renderer';

export type IpcLoggerOptions = {
  /**
   * Usually the main window of the application.
   * When the `parent` is closed, the IpcLogger will be closed too.
   */
  parent?: BrowserWindow;
  /**
   * When `true` the UI window will show as soon as it's ready.
   * If set to `false`, it can be opened at the convenient time by calling
   * `openIpcLoggerWindow`
   *
   * @default true
   */
  openUiOnStart?: boolean;
  /**
   * Option to quickly enable or disable logging without overriding other options.
   * `true` to enable logging, `false` to disable it.
   *
   * @default false
   */
  disable?: boolean;
  /**
   * Log messages sent from the main process to the renderer process.
   *
   * @default true
   */
  mainToRenderer?: boolean;
  /**
   * Log messages sent from the renderer process to the main process.
   *
   * @default true
   */
  rendererToMain?: boolean;
  /**
   * Output the intercepted messages to the console (from the main process).
   *
   * @default true
   */
  consoleOutput?: boolean;
  /**
   * `true` to include system messages in the log, `false` to exclude them.
   * (Messages prefixed with `ELECTRON` or `CHROME`)
   * @default false;
   */
  logSystemMessages?: boolean;
  /**
   * To display the logged renderers, this library installs a chrome extension
   * to provide an extra panel in the devTools.
   * Usually, the location will be automatically resolved but can be overriden
   * if having any problem due to a different build configuration with this
   */
  extensionPath?: string;
  /**
   * IPC channel to apply the filter to.
   * This is a more advanced alternative to `logSystemMessages`.
   * Note that unless `logSystemMessages` is set to `true`, the `filter` won't
   * receive data from IPC channels considered as system messages.
   *
   * @param channel
   * @returns `true` to log the message, `false` to ignore it.
   */
  filter?: (data: IpcLogData) => boolean;
  /**
   * Callback to handle the intercepted messages with custom code.
   */
  onIpcMessage?: (channel: string, ...data: any[]) => void;
};

export type IpcLogData = {
  /** Timestamp of the event */
  t: number;
  /** Sequential unique ID of the event */
  n: number;
  /** Method used to send the message (send/invoke/...) */
  method: string;
  /** Name of the channel where the event was sent */
  channel: string;
  /** Arguments for the event (no arguments = empty array) */
  args: any[];
  /** On invoke methods, the result if any */
  result?: any;
  senderId?: number;
  frameId?: number;
};

export type IpcLoggerApi = Readonly<{
  /** Start time, to calculate relative times */
  startTime: number;
  /** electron ipcRenderer accessor */
  ipcRenderer: IpcRenderer;
  /** Allows registering listeners called when new IPC data is caught */
  onUpdate: (cb: (data: ReadonlyArray<IpcLogData>) => void) => void;
}>;

export type IpcLoggerMsg = IpcLoggerMsgNewLog | IpcLoggerMsgUpdateResult;
export type IpcLoggerMsgNewLog = { log: IpcLogData };
export type IpcLoggerMsgUpdateResult = { result: any; n: number };

export const API_NAMESPACE = '__ELECTRON_IPC_LOGGER__';
export const IPC_CHANNEL = '__ELECTRON_IPC_LOGGER__';

export const DEFAULT_OPTIONS: IpcLoggerOptions = {
  openUiOnStart: true,
  disable: false,
  mainToRenderer: true,
  rendererToMain: true,
  consoleOutput: true,
  logSystemMessages: false,
};

export function isSystemChannel(channel: string): boolean {
  return channel.startsWith('ELECTRON') || channel.startsWith('CHROME');
}
