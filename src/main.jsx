import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { validateEnv } from './env.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { AppProvider } from './contexts/AppContext.jsx';

// Validate environment variables at startup
validateEnv();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
