import { app, BrowserWindow, Event } from 'electron';
import { getAbsolutePath } from './utils/get-absolute-path.js';
import { IpcLoggerOptions } from '../shared.js';

let win: BrowserWindow | undefined;
let parentWin: BrowserWindow | undefined;
/** Only closes "for real" when exiting the app. Meanwhile it just hides */
let closeForReal = false;

/**
 * Opens the IpcLogger UI window.
 * When the IpcLogger is disabled, does nothing.
 *
 * @returns the UI window to allow managing it
 * (i.e. track its position to "remember" it, etc.)
 * Can be `undefined` (when installed with `disabled: true` options)
 */
export function openIpcLoggerWindow(): BrowserWindow | undefined {
  if (!win) return;
  win.show();
  return win;
}

/**
 * Closes the IpcLogger UI window.
 * When the IpcLogger is disabled, does nothing.
 *
 * @returns the UI window to allow managing it
 * (i.e. track its position to "remember" it, etc.)
 * Can be `undefined` (when installed with `disabled: true` options)
 */
export function closeIpcLoggerWindow(): BrowserWindow | undefined {
  if (!win) return;
  win.hide();
  return win;
}

/**
 * Set the parent window for the IpcLogger UI in case that it was installed
 * without it (or just set a new parent).
 * When set, the IpcLogger UI will be closed when the parent is closed.
 *
 * When the IpcLogger is disabled, does nothing.
 *
 * @param parent Parent to set
 */
export function setIpcLoggerParentWindow(parent?: BrowserWindow): void {
  /*
   * Due to async timings, this scenario can easily happen:
   * 1. `installIpcLogger` is called
   * 2. it calls `getUiWindow` but it returns a promise, so does nothing
   * 3. `setIpcLoggerParentWindow` is called, but `win` is still undefined
   * 5. `getUiWindow` promise executes and window gets created, but the parent
   * is lost
   *
   * That's why the parent is stored here, and assigned once the win is created
   */
  parentWin = parent;
  if (!win) return;

  win.getParentWindow()?.off('close', closeWindowForReal);
  win.setParentWindow(parent);
  parent?.on('close', closeWindowForReal);
}

export function getUiWindow({
  closeIfLastWindow,
  parent,
}: Pick<
  IpcLoggerOptions,
  'closeIfLastWindow' | 'parent'
>): Promise<BrowserWindow> {
  if (win) return Promise.resolve(win);

  return new Promise<BrowserWindow>((resolve, reject) => {
    try {
      if (parent) {
        parentWin = parent;
      }

      win = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
          preload: getAbsolutePath('dist', 'preload', 'index.cjs'),
          sandbox: false,
        },
      });

      win.loadFile(getAbsolutePath('dist', 'ui', 'index.html'));
      win.on('ready-to-show', () => {
        resolve(win);
      });
      win.on('close', (event) => {
        if (closeForReal) return;
        event.preventDefault();
        win.hide();
      });

      if (closeIfLastWindow) {
        /*
         * Listener for when a `window` is closed, check if there's only one
         * remaining and it's the IpcLogger UI window. If so, close it too.
         */
        const whenClosedCheckIfIsLastToCloseTheUi = (window: BrowserWindow) => {
          if (window === win) return;
          window.on('closed', () => {
            const allWindows = BrowserWindow.getAllWindows();
            if (allWindows.length !== 1 || allWindows[0] !== win) return;
            closeWindowForReal();
          });
        };

        // register the listener for every existing window
        BrowserWindow.getAllWindows().forEach(
          whenClosedCheckIfIsLastToCloseTheUi
        );
        // and every other window to be created after
        app.on('browser-window-created', (ev, win) =>
          whenClosedCheckIfIsLastToCloseTheUi(win)
        );
      }

      if (parent || parentWin) {
        setIpcLoggerParentWindow(parent || parentWin);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function closeWindowForReal(): void {
  closeForReal = true;
  win.close();
}
