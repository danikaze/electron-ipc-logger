/**
 * This script is executed in the page window and acts as a proxy to re-route
 * IPC messages between the window and the main process, through the chrome
 * extension so the devtools can process the information, as the devtools can't
 * access the window directly (therefore, the `IpcLoggerApi`)
 */

import { API_NAMESPACE, IpcLoggerApi } from '../shared';

const ALREADY_SET_FIELD = `${API_NAMESPACE}CONTENT`;

console.log('msg-proxy running...');

waitForApi();

function waitForApi() {
  if (window[ALREADY_SET_FIELD]) {
    console.log(`msg Proxy already set. Exiting...`);
    return;
  }
  window[ALREADY_SET_FIELD] = true;

  console.log(`checking for window.${API_NAMESPACE}...`);
  const api = window[API_NAMESPACE];
  if (api) {
    console.log('API!', api);
    run(api);
  } else {
    setTimeout(waitForApi, 1000);
  }
}

function run(api: IpcLoggerApi) {
  console.log('msg-proxy OK!');

  chrome.runtime.sendMessage(chrome.runtime.id, 'Test message', (response) => {
    console.log('Reply:', response);
  });
}
