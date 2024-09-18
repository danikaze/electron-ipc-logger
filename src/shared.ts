import type { IpcRenderer } from 'electron/renderer';

export type LogIpcMessagesOptions = {
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
   * Internal IPC channel to let the ipc-logger window know what information to
   * show.
   * It doesn't need to be changed unless your application already uses a channel
   * with the same name.
   *
   * @default `"__ipcLogger__"`
   */
  ipcChannel?: string;
  /**
   * IPC channel to apply the filter to.
   * This is a more advanced alternative to `logSystemMessages`.
   * Note that unless `logSystemMessages` is set to `true`, the `filter` won't
   * receive data from IPC channels considered as system messages.
   *
   * @param channel
   * @returns `true` to log the message, `false` to ignore it.
   */
  filter?: (data: LogData) => boolean;
  /**
   * Callback to handle the intercepted messages with custom code.
   */
  onIpcMessage?: (channel: string, ...data: any[]) => void;
};

export type LogData = {
  t: number;
  method: string;
  channel: string;
  args: any[];
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
  onUpdate: (cb: (data: ReadonlyArray<LogData>) => void) => void;
}>;

export const API_NAMESPACE = '__IPC_LOGGER__';

export const DEFAULT_OPTIONS: LogIpcMessagesOptions = {
  disable: false,
  mainToRenderer: true,
  rendererToMain: true,
  consoleOutput: true,
  logSystemMessages: false,
  ipcChannel: '__ipcLogger__',
};

export function isSystemChannel(channel: string): boolean {
  return channel.startsWith('ELECTRON') || channel.startsWith('CHROME');
}
