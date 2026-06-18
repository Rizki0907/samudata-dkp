import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert, User as UserIcon } from 'lucide-react';

export default function Header() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* We can put breadcrumbs or page title here dynamically if needed */}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {isAdmin ? 'Admin DKP Jatim' : 'Pengguna Publik'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Akses Penuh' : 'Akses Lihat'}
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
