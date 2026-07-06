import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAppState } from '../../context/AppContext';
import { Sun, Moon, Bell } from 'lucide-react';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { alertCount } = useAppState();

  // Map path to breadcrumb label
  const getBreadcrumb = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/chat':
        return 'AI Workspace';
      case '/agents':
        return 'Agent Network';
      case '/profile':
        return 'Farm Profile';
      case '/settings':
        return 'Settings';
      case '/weather':
        return 'Weather Intel';
      case '/market':
        return 'Market Mandi';
      case '/disease':
        return 'Disease Scanner';
      case '/schemes':
        return 'Gov Schemes';
      case '/analytics':
        return 'Soil Analytics';
      case '/notifications':
        return 'Proactive Notifications';
      default:
        return 'KrishiMitra AI';
    }
  };

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Breadcrumbs */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider">
          {getBreadcrumb()}
        </h2>
      </div>

      {/* Action Utility Bar */}
      <div className="flex items-center gap-4">
        {/* Proactive Notification bell */}
        <div className="relative">
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition relative"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center animate-bounce">
                {alertCount}
              </span>
            )}
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center border border-emerald-250 dark:border-emerald-800 shadow-sm text-emerald-700 dark:text-emerald-300 font-semibold text-xs cursor-pointer">
          KM
        </div>
      </div>
    </header>
  );
};
