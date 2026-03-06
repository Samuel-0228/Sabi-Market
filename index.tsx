
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

console.log('ሳቪ – AAU Sync: Initializing application...');

import App from './app/App';
import { LanguageProvider } from './app/LanguageContext';
import { ThemeProvider } from './app/ThemeContext';

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}
