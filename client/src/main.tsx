import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import AppErrorBoundary from './components/common/AppErrorBoundary';
import { initializeCsrfToken } from './services/api';
import './index.css';

registerSW({
  immediate: true,
  onRegisterError(error) {
    console.error('Service worker registration failed:', error);
  },
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'mindfullife:navigate' && typeof event.data.url === 'string') {
      window.location.assign(event.data.url);
    }
  });
}

void initializeCsrfToken().catch((error) => {
  console.error('CSRF token initialization failed:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
