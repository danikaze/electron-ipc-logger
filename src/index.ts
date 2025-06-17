export { IpcLoggerOptions, IpcLogData, isSystemChannel } from './shared.js';
export { installIpcLogger } from './lib/main.js';
export {
  openIpcLoggerWindow,
  closeIpcLoggerWindow,
  setIpcLoggerParentWindow,
} from './lib/window.js';
