import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminPerikananTangkap from '../pages/admin/AdminPerikananTangkap';
import { useAuthStore } from '@/store/authStore';

// Public Pages
import Overview from '../pages/user/Overview';
import PerikananTangkap from '../pages/user/PerikananTangkap';
import KelautanPesisir from '../pages/user/KelautanPesisir';
import Budidaya from '../pages/user/Budidaya';
import PengolahanPemasaran from '../pages/user/PengolahanPemasaran';

import Ekspor from '../pages/user/Ekspor';

// Admin Pages
import AdminKelautanPesisir from '../pages/admin/AdminKelautanPesisir';
import AdminBudidaya from '../pages/admin/AdminBudidaya';
import AdminPengolahanPemasaran from '../pages/admin/AdminPengolahanPemasaran';

import AdminEkspor from '../pages/admin/AdminEkspor';
import MasterData from '../pages/admin/MasterData';

// Protected Route Guard for Admin
const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'admin_cabang' && user?.role !== 'admin_pusat') {
    return <Navigate to="/user" replace />;
  }
  return children;
};

// Protected Route Guard for Admin Pusat Only
const AdminPusatRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'admin_pusat') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

// Root Redirect based on role
const RootRedirect = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin_cabang' || user?.role === 'admin_pusat';
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/user" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/user',
    element: <DashboardLayout role="user" />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'perikanan-tangkap', element: <PerikananTangkap /> },
      { path: 'kelautan-pesisir', element: <KelautanPesisir /> },
      { path: 'budidaya', element: <Budidaya /> },
      { path: 'pengolahan-pemasaran', element: <PengolahanPemasaran /> },

      { path: 'ekspor', element: <Ekspor /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <DashboardLayout role="admin" />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Overview /> },
      { path: 'perikanan-tangkap', element: <AdminPerikananTangkap /> },
      { path: 'budidaya', element: <AdminBudidaya /> },
      { path: 'kelautan-pesisir', element: <AdminPusatRoute><AdminKelautanPesisir /></AdminPusatRoute> },
      { path: 'pengolahan-pemasaran', element: <AdminPusatRoute><AdminPengolahanPemasaran /></AdminPusatRoute> },
      { path: 'ekspor', element: <AdminPusatRoute><AdminEkspor /></AdminPusatRoute> },
      { path: 'master-data', element: <AdminPusatRoute><MasterData /></AdminPusatRoute> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/user" replace />
  }
]);
