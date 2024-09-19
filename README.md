# electron-ipc-logger

Log and display all user-defined IPC traffic in an electron app.

## How does internally works?

A.K.A. Helping myself to remember the underlying architecture.

First thing required is to call `installIpcLogger()` from the **main** process.

This will create a UI browser window for the IpcLogger to display the data. Yes, this is always done whether shown or not. This is a package for debugging IPC messages so, don't forget to disable it on production (by not calling `installIpcLogger` or by passing the `disabled: true` option).

Once a reference to the window is available, all the relevant IPC methods in `ipcMain` will be _hijacked_, allowing the capture of incoming and outcoming messages, but this alone will not be able capture messages sent when _replying_ incoming events (as it's not done through the `ipcMain` object, but using the `WebContents` of the sender directly).

For that, `BrowserWindow.WebContents` need to be hijacked as well, which is done by getting all the existing windows and listening for the creation of new ones (with the help of the [browser-window-created](https://www.electronjs.org/docs/latest/api/app#event-browser-window-created) event).

The UI window is initialized with the [preload](src/ui/preload.ts) script which exposes some data and the `IpcRenderer`, which will be used to send/receive the captured IPC messages.

IPC messages are captured always in the main process and sent to the UI window using IPCs as well. The installed preload script will store them and make them available for the UI.

The UI window loads [an empty page](src/ui/index.html) that executes [index.tsx](src/ui/index.tsx) rendering the UI itself via React. This UI registers a listener to _react_ when new data is received from the main process, and from here is just displaying the data as any usual web-app.
