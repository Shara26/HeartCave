import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3200,
            style: {
              borderRadius: '16px',
              background: '#ffffff',
              color: '#4a356a',
              border: '1px solid #ddd3f2',
              boxShadow: '0 10px 40px -12px rgba(123, 87, 189, 0.25)',
              fontFamily: 'Nunito, system-ui, sans-serif',
              fontWeight: 600,
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
