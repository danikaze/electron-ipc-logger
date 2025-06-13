import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { API_NAMESPACE, IPC_CHANNEL, IpcLoggerApi } from '../shared';
import { Renderer } from './renderer';

import './reset-v2.css';
import './style.scss';

renderUi();

/**
 * Render the UI
 */
async function renderUi() {
  const api = window[API_NAMESPACE] as IpcLoggerApi;
  // First thing is getting from the main process the options to use for the UI
  const options = await api.getOptions();
  // Then, render the UI
  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <Renderer api={api} options={options} />
    </StrictMode>
  );
}
