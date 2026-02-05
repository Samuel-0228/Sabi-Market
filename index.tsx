
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { LanguageProvider } from './app/LanguageContext';
import { ThemeProvider } from './app/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
