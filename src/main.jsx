import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './assets/styles/global.css';
import './assets/styles/layout.css';
import './assets/styles/components.css';

import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
