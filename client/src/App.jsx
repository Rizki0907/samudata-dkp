import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

function App() {
  const { checkAuth } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    checkAuth();
    initTheme();
  }, [checkAuth, initTheme]);

  return <RouterProvider router={router} />;
}

export default App;
