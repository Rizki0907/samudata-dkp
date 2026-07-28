import { createBrowserRouter, Navigate, useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
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

// Custom ErrorBoundary Page
const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-card border border-border/60 rounded-2xl p-8 shadow-xl flex flex-col items-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-heading text-foreground">Terjadi Kesalahan pada Aplikasi</h1>
          <p className="text-sm text-muted-foreground">
            {error?.statusText || error?.message || "Mohon maaf, halaman yang Anda tuju mengalami masalah tidak terduga."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 w-full">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang
          </button>
          <button
            onClick={() => navigate('/user', { replace: true })}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-all"
          >
            <Home className="w-4 h-4" />
            Ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};

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

// Root Redirect to Public User Dashboard by default
const RootRedirect = () => {
  return <Navigate to="/user" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/user',
    element: <DashboardLayout role="user" />,
    errorElement: <ErrorPage />,
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
    errorElement: <ErrorPage />,
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
    element: <Navigate to="/user" replace />,
    errorElement: <ErrorPage />,
  }
]);
