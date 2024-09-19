export { IpcLoggerOptions, IpcLogData, isSystemChannel } from './shared';
export { installIpcLogger, uninstallIpcLogger } from './lib/main';
export {
  openIpcLoggerWindow,
  closeIpcLoggerWindow,
  setIpcLoggerParentWindow,
} from './lib/window';
