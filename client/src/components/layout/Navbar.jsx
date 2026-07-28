import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { 
  Waves, Sprout, Fish, Package, Database, Globe, 
  LayoutDashboard, LogOut, Lock, User as UserIcon, 
  ShieldAlert, Menu, X, Loader2 
} from 'lucide-react';
import api from '@/services/api';
import iconDKP from '@/assets/icon_DKP.png';

const USER_MENUS = [
  { title: 'Overview', path: '/user', icon: LayoutDashboard },
  { title: 'Perikanan Tangkap', path: '/user/perikanan-tangkap', icon: Fish },
  { title: 'Perikanan Budidaya', path: '/user/budidaya', icon: Waves },
  { title: 'Kelautan dan Pesisir', path: '/user/kelautan-pesisir', icon: Sprout },
  { title: 'Pengolahan dan Pemasaran', path: '/user/pengolahan-pemasaran', icon: Package },
  { title: 'Ekspor', path: '/user/ekspor', icon: Globe },
];

export default function Navbar() {
  const { loginAsAdmin } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const menus = USER_MENUS;

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await api.post('/auth/login', { adminCode });
      if (res.data.success) {
        loginAsAdmin(res.data.token);
        setShowAdminModal(false);
        setAdminCode('');
        setMobileMenuOpen(false);
        navigate('/admin');
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="h-16 md:h-[76px] border-b border-border bg-card/85 backdrop-blur-xl sticky top-0 z-40 transition-all duration-300">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-full flex items-center justify-between gap-4">
          
          {/* Logo & Brand (Left) */}
          <div 
            onClick={() => navigate('/user')}
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform overflow-hidden p-1.5">
              <img src={iconDKP} alt="Icon DKP" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-heading font-bold text-lg leading-tight tracking-wide text-foreground group-hover:text-primary transition-colors">
                SAMUDERA
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                DKP Jawa Timur
              </span>
            </div>
          </div>

          {/* Center Navbar (Desktop - Pure / Tanpa Kotakan) */}
          <nav className="hidden md:flex items-center justify-center gap-2 lg:gap-4 xl:gap-6">
            {menus.map((menu) => {
              const isActive = location.pathname === menu.path;
              
              return (
                <NavLink
                  key={menu.path}
                  to={menu.path}
                  className={cn(
                    "px-4 lg:px-5 py-2 rounded-full text-sm lg:text-[15px] font-medium transition-all duration-200 whitespace-nowrap",
                    isActive 
                      ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25 scale-[1.02]" 
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <span>{menu.title}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Section: Role Badge / Login Admin */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground leading-tight">
                  Pengguna Publik
                </p>
                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 leading-tight mt-0.5">
                  <Lock className="w-3 h-3" /> Akses Lihat
                </p>
              </div>
              <button
                onClick={() => setShowAdminModal(true)}
                className="w-9 h-9 rounded-full bg-muted border border-border hover:border-primary flex items-center justify-center text-primary hover:bg-primary/10 transition-all cursor-pointer hover:scale-105"
                title="Klik ikon untuk masuk otentikasi Admin"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl px-4 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              {menus.map((menu) => {
                const isActive = location.pathname === menu.path;
                return (
                  <NavLink
                    key={menu.path}
                    to={menu.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span>{menu.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Admin Login Modal (Original Design from LandingPage) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => {
              setShowAdminModal(false);
              setError(false);
              setAdminCode('');
            }}
          />
          <div className={cn(
            "bg-card border border-border rounded-2xl w-full max-w-md p-8 relative z-10 shadow-2xl transition-all",
            error && "animate-[shake_0.5s_ease-in-out]"
          )}>
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Lock className="w-6 h-6 text-accent" />
              Otentikasi Admin
            </h3>

            <form onSubmit={handleAdminSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Kode Akses Admin
                </label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value);
                    setError(false);
                  }}
                  autoFocus
                  placeholder="Masukkan kode..."
                  className={cn(
                    "w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all",
                    error ? "border-destructive focus:ring-destructive/50" : "border-border focus:border-primary focus:ring-primary/50"
                  )}
                />
                {error && (
                  <p className="text-destructive text-sm mt-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <ShieldAlert className="w-4 h-4" />
                    Kode admin tidak valid
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setError(false);
                    setAdminCode('');
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !adminCode}
                  className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Style for shake animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}} />
    </>
  );
}
