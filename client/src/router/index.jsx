import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import PlaceholderPage from '../pages/PlaceholderPage';
import AdminPerikananTangkap from '../pages/admin/AdminPerikananTangkap';
import { useAuthStore } from '@/store/authStore';

// Public Pages
import PerikananTangkap from '../pages/user/PerikananTangkap';
import KelautanPesisir from '../pages/user/KelautanPesisir';
import Budidaya from '../pages/user/Budidaya';
import PengelolaanPemasaran from '../pages/user/PengelolaanPemasaran';
import Garam from '../pages/user/Garam';
import Ekspor from '../pages/user/Ekspor';

// Admin Pages
import AdminKelautanPesisir from '../pages/admin/AdminKelautanPesisir';
import AdminBudidaya from '../pages/admin/AdminBudidaya';
import AdminPengelolaanPemasaran from '../pages/admin/AdminPengelolaanPemasaran';
import AdminGaram from '../pages/admin/AdminGaram';
import AdminEkspor from '../pages/admin/AdminEkspor';

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
      { path: 'perikanan-tangkap', element: <PerikananTangkap /> },
      { path: 'kelautan-pesisir', element: <KelautanPesisir /> },
      { path: 'budidaya', element: <Budidaya /> },
      { path: 'pengelolaan', element: <PengelolaanPemasaran /> },
      { path: 'garam', element: <Garam /> },
      { path: 'ekspor', element: <Ekspor /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute><DashboardLayout /></AdminRoute>,
    children: [
      { index: true, element: <PlaceholderPage title="Overview Admin" /> },
      { path: 'perikanan-tangkap', element: <AdminPerikananTangkap /> },
      { path: 'kelautan-pesisir', element: <AdminKelautanPesisir /> },
      { path: 'budidaya', element: <AdminBudidaya /> },
      { path: 'pengelolaan', element: <AdminPengelolaanPemasaran /> },
      { path: 'garam', element: <AdminGaram /> },
      { path: 'ekspor', element: <AdminEkspor /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
