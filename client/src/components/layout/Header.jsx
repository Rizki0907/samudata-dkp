import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert, User as UserIcon, Menu } from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';

export default function Header({ setMobileMenuOpen }) {
  const { user } = useAuthStore();
  const isAdminPusat = user?.role === 'admin_pusat';
  const isAdminCabang = user?.role === 'admin_cabang';
  const isAdmin = isAdminPusat || isAdminCabang;

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu for Mobile */}
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {isAdminPusat ? 'Pusat' : isAdminCabang ? 'Unit Kerja' : 'Pengguna Publik'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAdminPusat ? 'Akses Validasi' : isAdminCabang ? 'Akses Input' : 'Akses Lihat'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center">
            {isAdmin ? (
              <ShieldAlert className="w-5 h-5 text-accent" />
            ) : (
              <UserIcon className="w-5 h-5 text-primary" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
