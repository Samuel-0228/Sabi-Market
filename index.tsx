
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { LanguageProvider } from './app/LanguageContext';
import { ThemeProvider } from './app/ThemeContext';

// Ensure the root element exists before attempting to mount
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
} else {
  console.error("Critical Error: Root container not found in index.html");
}
