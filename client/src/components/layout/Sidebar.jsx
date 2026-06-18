import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { cn } from '@/lib/utils';
import { 
  Waves, Sprout, Fish, Package, Beaker, Globe, 
  LayoutDashboard, LogOut, ChevronLeft
} from 'lucide-react';

const USER_MENUS = [
  { title: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Perikanan Tangkap', path: '/dashboard/perikanan-tangkap', icon: Fish },
  { title: 'Kelautan & Pesisir', path: '/dashboard/kelautan-pesisir', icon: Waves },
  { title: 'Budidaya', path: '/dashboard/budidaya', icon: Sprout },
  { title: 'Pengelolaan', path: '/dashboard/pengelolaan', icon: Package },
  { title: 'Garam', path: '/dashboard/garam', icon: Beaker },
  { title: 'Ekspor', path: '/dashboard/ekspor', icon: Globe },
];

const ADMIN_MENUS = [
  { title: 'Overview Admin', path: '/admin', icon: LayoutDashboard },
  { title: 'Perikanan Tangkap', path: '/admin/perikanan-tangkap', icon: Fish },
  { title: 'Kelautan & Pesisir', path: '/admin/kelautan-pesisir', icon: Waves },
  { title: 'Budidaya', path: '/admin/budidaya', icon: Sprout },
  { title: 'Pengelolaan', path: '/admin/pengelolaan', icon: Package },
  { title: 'Garam', path: '/admin/garam', icon: Beaker },
  { title: 'Ekspor', path: '/admin/ekspor', icon: Globe },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const menus = isAdmin ? ADMIN_MENUS : USER_MENUS;

  return (
    <aside 
      className={cn(
        "bg-card border-r border-border h-screen sticky top-0 transition-all duration-300 flex flex-col z-40",
        collapsed ? "w-20" : "w-64"
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
              <span className="font-heading font-bold text-lg leading-tight">SAMUDATA</span>
              <span className="text-xs text-muted-foreground">DKP Jawa Timur</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-muted rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors z-50"
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
              window.location.href = '/';
            }}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Keluar (Admin)</span>}
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
  );
}
