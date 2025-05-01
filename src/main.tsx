import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { UserSettingsProvider } from './context/UserSettingsContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <AuthProvider>
      <UserSettingsProvider>
        <App />
      </UserSettingsProvider>
    </AuthProvider>
  </StrictMode>
);

// Handle offline/online events
window.addEventListener('online', () => {
  console.log('Aplicativo online');
});

window.addEventListener('offline', () => {
  console.log('Aplicativo offline');
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}