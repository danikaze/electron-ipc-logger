import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { API_NAMESPACE, IpcLoggerApi } from '../shared';
import { Renderer } from './renderer';
import { UiOptionsProvider } from './ui-options';

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
      <UiOptionsProvider value={options}>
        <Renderer api={api} />
      </UiOptionsProvider>
    </StrictMode>
  );
}
