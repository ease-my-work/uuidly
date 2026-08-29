import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@/assets/tailwind.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from popup/index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
