import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './index.css';

// Auto-recover from Vite dynamic import chunk mismatches across updates/rebuilds
const triggerAutoChunkReload = () => {
  const reloadKey = 'nextera_vite_preload_ts';
  const last = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  if (!last || now - parseInt(last, 10) > 8000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
};

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  triggerAutoChunkReload();
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event?.reason?.message || event?.reason || '');
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  ) {
    event.preventDefault();
    triggerAutoChunkReload();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
