import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert, User, Lock, Loader2, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const navigate = useNavigate();
  const { loginAsUser, loginAsAdmin } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUserLogin = () => {
    loginAsUser();
    navigate('/user');
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      // Import api at the top if not imported yet
      // For now, we can use fetch or the api service
      const api = (await import('@/services/api')).default;
      const res = await api.post('/auth/login', { adminCode });

      if (res.data.success) {
        loginAsAdmin(res.data.token);
        navigate('/admin');
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center z-10 mb-12">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-card border border-primary/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.2)] overflow-hidden p-3">
            <img src="/icon_DKP.png" alt="Logo DKP" className="w-full h-full object-contain drop-shadow-md" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
          SAMUDERA
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
          Sistem Aplikasi Manunggal Data.<br className="hidden md:block"/>Pusat Informasi Kelautan & Perikanan Provinsi Jawa Timur yang terpadu, transparan, dan akurat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-6 z-10">
        {/* User Card */}
        <button
          onClick={handleUserLogin}
          className="group relative bg-card/80 backdrop-blur-xl border border-border hover:border-primary/50 rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,212,255,0.3)] flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Akses Publik</h2>
          <p className="text-muted-foreground">Lihat visualisasi dan statistik kelautan perikanan Jawa Timur.</p>
        </button>

        {/* Admin Card */}
        <button
          onClick={() => setShowModal(true)}
          className="group relative bg-card/80 backdrop-blur-xl border border-border hover:border-accent/50 rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(240,165,0,0.3)] flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Admin DKP</h2>
          <p className="text-muted-foreground">Kelola data, input laporan harian, dan unggah dataset.</p>
        </button>
      </div>

      {/* Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setShowModal(false)}
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
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !adminCode}
                  className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
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
    </div>
  );
}
