import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import PlaceholderPage from '../pages/PlaceholderPage';
import { useAuthStore } from '../store/authStore';

// Protected Route Guard for Admin
const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Protected Route Guard for User
const UserRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/dashboard',
    element: <UserRoute><DashboardLayout /></UserRoute>,
    children: [
      { index: true, element: <PlaceholderPage title="Overview Publik" /> },
      { path: 'perikanan-tangkap', element: <PlaceholderPage title="Perikanan Tangkap (Publik)" /> },
      { path: 'kelautan-pesisir', element: <PlaceholderPage title="Kelautan & Pesisir (Publik)" /> },
      { path: 'budidaya', element: <PlaceholderPage title="Budidaya (Publik)" /> },
      { path: 'pengelolaan', element: <PlaceholderPage title="Pengelolaan & Pemasaran (Publik)" /> },
      { path: 'garam', element: <PlaceholderPage title="Garam (Publik)" /> },
      { path: 'ekspor', element: <PlaceholderPage title="Ekspor (Publik)" /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute><DashboardLayout /></AdminRoute>,
    children: [
      { index: true, element: <PlaceholderPage title="Overview Admin" /> },
      { path: 'perikanan-tangkap', element: <PlaceholderPage title="Admin - Perikanan Tangkap" /> },
      { path: 'kelautan-pesisir', element: <PlaceholderPage title="Admin - Kelautan & Pesisir" /> },
      { path: 'budidaya', element: <PlaceholderPage title="Admin - Budidaya" /> },
      { path: 'pengelolaan', element: <PlaceholderPage title="Admin - Pengelolaan & Pemasaran" /> },
      { path: 'garam', element: <PlaceholderPage title="Admin - Garam" /> },
      { path: 'ekspor', element: <PlaceholderPage title="Admin - Ekspor" /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
