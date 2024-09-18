import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Renderer } from './renderer';

import './style.scss';

let errors: string[] = [];

(async () => {
  try {
    await chrome.scripting.executeScript({
      target: {
        tabId: chrome.devtools.inspectedWindow.tabId,
      },
      world: 'MAIN',
      files: ['content.js'],
    });
  } catch (e: unknown) {
    errors.push(e.toString?.() ?? (e as string));
  }

  chrome.devtools.panels.create('IPC', '', 'index.html', () => {
    createRoot(document.getElementById('root') as HTMLElement).render(
      <StrictMode>
        <Renderer errors={errors} />
      </StrictMode>
    );
  });
})();
