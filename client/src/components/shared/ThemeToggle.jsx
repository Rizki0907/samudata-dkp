
import { useThemeStore } from '@/store/themeStore';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full bg-muted border border-border hover:border-primary flex items-center justify-center text-foreground hover:bg-primary/10 transition-all cursor-pointer hover:scale-105"
      title={isDark ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
      aria-label="Toggle Dark and Light Mode"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300" />
      ) : (
        <Moon className="w-5 h-5 text-primary transition-transform duration-300" />
      )}
    </button>
  );
}
