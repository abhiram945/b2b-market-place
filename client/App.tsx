import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import { useDispatch } from 'react-redux';
import { loadUserFromToken } from './redux/slices/userSlice';
import { AppDispatch } from './redux/store';

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Force light theme root
    document.documentElement.classList.remove('dark');
    
    // On initial app load, try to load user from the token in localStorage.
    dispatch(loadUserFromToken());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
