import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import { useDispatch } from 'react-redux';
import { rehydrateAuth } from './redux/slices/userSlice';
import { AppDispatch } from './redux/store';

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Force light theme root
    document.documentElement.classList.remove('dark');
    
    // On initial app load, try to rehydrate session from token or cookie.
    dispatch(rehydrateAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
