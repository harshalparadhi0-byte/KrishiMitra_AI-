import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppState } from '../../context/AppContext';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { isLoading, error, clearError } = useAppState();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Navigation */}
        <Header />

        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[1px] z-40 flex items-center justify-center pointer-events-auto">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Syncing with KrishiMitra AI...</span>
            </div>
          </div>
        )}

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {/* Global Alert Notification Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-rose-200 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/15 text-rose-800 dark:text-rose-350 text-xs font-medium flex justify-between items-center gap-3 animate-fadeIn">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                {error}
              </span>
              <button 
                onClick={clearError}
                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Child Routes Content Outlet */}
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
