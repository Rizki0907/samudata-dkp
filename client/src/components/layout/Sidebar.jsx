import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { 
  Waves, Sprout, Fish, Package, Database, Globe, 
  LayoutDashboard, LogOut, ChevronLeft, Ship, X
} from 'lucide-react';

const USER_MENUS = [
  { title: 'Overview', path: '/user', icon: LayoutDashboard },
  { title: 'Perikanan Tangkap', path: '/user/perikanan-tangkap', icon: Ship },
  { title: 'Perikanan Budidaya', path: '/user/budidaya', icon: Fish },
  { title: 'Kelautan dan Pesisir', path: '/user/kelautan-pesisir', icon: Waves },
  { title: 'Pengolahan dan Pemasaran', path: '/user/pengolahan-pemasaran', icon: Package },

  { title: 'Ekspor', path: '/user/ekspor', icon: Globe },
];

const ADMIN_MENUS = [
  { title: 'Overview Admin', path: '/admin', icon: LayoutDashboard },
  { title: 'Perikanan Tangkap', path: '/admin/perikanan-tangkap', icon: Ship },
  { title: 'Perikanan Budidaya', path: '/admin/budidaya', icon: Fish },  
  { title: 'Kelautan dan Pesisir', path: '/admin/kelautan-pesisir', icon: Waves, reqPusat: true },
  { title: 'Pengolahan dan Pemasaran', path: '/admin/pengolahan-pemasaran', icon: Package, reqPusat: true },

  { title: 'Ekspor', path: '/admin/ekspor', icon: Globe, reqPusat: true },
  { title: 'Master Data', path: '/admin/master-data', icon: Database, reqPusat: true },
];

export default function Sidebar({ collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const isAdmin = user?.role === 'admin_cabang' || user?.role === 'admin_pusat';
  const menus = isAdmin ? ADMIN_MENUS.filter(m => !m.reqPusat || user?.role === 'admin_pusat') : USER_MENUS;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside 
        className={cn(
          "bg-card border-r border-border h-screen flex flex-col z-50 transition-all duration-300",
          "fixed inset-y-0 left-0 md:sticky md:top-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-72 md:w-20" : "w-72"
        )}
      >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-border relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20">
            <Waves className="w-6 h-6 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-heading font-bold text-lg leading-tight">SAMUDERA</span>
              <span className="text-xs text-muted-foreground">DKP Jawa Timur</span>
            </div>
          )}
        </div>
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
        >
          <X className="w-5 h-5" />
        </button>

        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-muted rounded-full border border-border hidden md:flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors z-50"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isActive = location.pathname === menu.path;
          
          return (
            <NavLink
              key={menu.path}
              to={menu.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? menu.title : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <span className="whitespace-nowrap">{menu.title}</span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-border">
        {isAdmin ? (
          <button
            onClick={() => {
              logout();
              window.location.href = import.meta.env.BASE_URL;
            }}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && (
              <span>
                {user?.role === 'admin_cabang'
                  ? 'Keluar (Unit Kerja)'
                  : user?.role === 'admin_pusat'
                  ? 'Keluar (Admin Pusat)'
                  : 'Keluar (Admin)'}
              </span>
            )}
          </button>
        ) : (
          <NavLink
            to="/"
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Ganti Role" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Ganti Role</span>}
          </NavLink>
        )}
      </div>
    </aside>
    </>
  );
}
