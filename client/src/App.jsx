import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useMasterDataStore } from '@/store/masterDataStore';

function App() {
  const { checkAuth } = useAuthStore();
  const { initTheme } = useThemeStore();
  const { fetchMasterData } = useMasterDataStore();

  useEffect(() => {
    checkAuth();
    initTheme();
    fetchMasterData();
  }, [checkAuth, initTheme, fetchMasterData]);

  return <RouterProvider router={router} />;
}

export default App;
