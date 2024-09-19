export { IpcLoggerOptions, IpcLogData, isSystemChannel } from './shared';
export { installIpcLogger } from './lib/main';
export {
  openIpcLoggerWindow,
  closeIpcLoggerWindow,
  setIpcLoggerParentWindow,
} from './lib/window';
