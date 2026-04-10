
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import './index.css';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { AlertProvider } from './contexts/AlertContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <Provider store={store}>
      <ThemeContextProvider>
        <AlertProvider>
          <App />
        </AlertProvider>
      </ThemeContextProvider>
    </Provider>
);
