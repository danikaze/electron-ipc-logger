import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Renderer } from './renderer';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Renderer errors={[]} />
  </StrictMode>
);
