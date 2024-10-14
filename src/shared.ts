import type { BrowserWindow } from 'electron';
import type { IpcRenderer } from 'electron/renderer';

export type IpcLoggerOptions = {
  /**
   * When `true` the UI window will show as soon as it's ready.
   * If set to `false`, it can be opened at the convenient time by calling
   * `openIpcLoggerWindow`
   *
   * @default true
   */
  openUiOnStart?: boolean;
  /**
   * When another window is closed, if the IPC Logger is opened and it's the
   * only remaining window, it will be automatically closed as well.
   * This is usually the wanted behavior, but can be set to `false` to check
   * data before the application exits.
   *
   * @default true
   */
  closeIfLastWindow?: boolean;
  /**
   * Usually the main window of the application.
   * When the `parent` is closed, the IpcLogger will be closed too.
   * It also makes the IpcLogger window stays on top of the parent all the time.
   */
  parent?: BrowserWindow;
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
   *
   * @default false;
   */
  logSystemMessages?: boolean;
  /**
   * Accelerator (key shortcut) to register globally to open the IPC Logger UI
   * window.
   * Can be set to `false` or empty string `''` to disable it (`true` will
   * just keep the default shortcut)
   *
   * @default `Command+Shift+D` on Mac (`Control+Shift+D` on other systems).
   * @see https://www.electronjs.org/docs/latest/api/accelerator
   */
  shortcut?: string | boolean;
  /**
   * IPC channel to apply the filter to.
   * This is a more advanced alternative to `logSystemMessages`.
   * Note that unless `logSystemMessages` is set to `true`, the `filter` won't
   * receive data from IPC channels considered as system messages.
   *
   * @param data Data from the received message
   * @returns `true` to log the message, `false` to drop it.
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
  method: 'handle' | 'handleOnce' | 'on' | 'once' | 'send';
  /** Name of the channel where the event was sent */
  channel: string;
  /** Arguments for the event (no arguments = empty array) */
  args: any[];
  /** On invoke methods, the result if any */
  result?: any;
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

export const DEFAULT_OPTIONS: Required<
  Omit<IpcLoggerOptions, 'parent' | 'filter' | 'onIpcMessage' | 'shortcut'> & {
    shortcut: Exclude<IpcLoggerOptions['shortcut'], boolean>;
  }
> = {
  openUiOnStart: true,
  closeIfLastWindow: true,
  disable: false,
  mainToRenderer: true,
  rendererToMain: true,
  consoleOutput: false,
  logSystemMessages: false,
  shortcut: 'CmdOrCtrl+Shift+D',
};

export function isSystemChannel(channel: string): boolean {
  return channel.startsWith('ELECTRON') || channel.startsWith('CHROME');
}
