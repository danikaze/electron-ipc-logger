import { app, BrowserWindow } from 'electron';
import { getAbsolutePath } from './utils/get-absolute-path';

let win: BrowserWindow;

export async function openIpcLoggerWindow(): Promise<BrowserWindow> {
  const win = await getWindow();
  win.show();
  return win;
}

export async function closeIpcLoggerWindow(): Promise<BrowserWindow> {
  const win = await getWindow();
  win.hide();
  return win;
}

function getWindow(): Promise<BrowserWindow> {
  if (win) return Promise.resolve(win);

  return new Promise<BrowserWindow>((resolve, reject) => {
    try {
      win = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
          preload: getAbsolutePath('dist', 'ui', 'preload.js'),
          sandbox: false,
        },
      });
      win.loadFile(getAbsolutePath('dist', 'ui', 'index.html'));
      win.on('ready-to-show', () => {
        resolve(win);
      });
    } catch (e) {
      reject(e);
    }
  });
}
