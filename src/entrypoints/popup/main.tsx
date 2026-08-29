import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { generate } from '@/lib/uuid';
import '@/assets/tailwind.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from popup/index.html');

// Generated BEFORE the root exists, so the first paint already has a UUID on it.
// Nothing async may enter this path — see docs/TECHNICAL.md §4.
const initialUuid = generate('v4');

createRoot(container).render(
  <StrictMode>
    <App initialUuid={initialUuid} />
  </StrictMode>,
);
