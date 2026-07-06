import { NavLink, useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppContext';
import { 
  Sprout, 
  LayoutDashboard, 
  MessageSquare, 
  User, 
  Settings as SettingsIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  History,
  Trash2,
  Cpu,
  CloudSun,
  BarChart3,
  ShieldAlert,
  Landmark,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Sidebar = () => {
  const { 
    sessions, 
    currentSessionId, 
    setCurrentSessionId, 
    createNewSession, 
    clearSessions,
    sidebarCollapsed, 
    setSidebarCollapsed,
    userId
  } = useAppState();
  const navigate = useNavigate();

  const coreNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'AI Workspace', icon: MessageSquare },
    { to: '/agents', label: 'Agent Network', icon: Cpu },
  ];

  const toolNavItems = [
    { to: '/weather', label: 'Weather Intel', icon: CloudSun },
    { to: '/market', label: 'Market Mandi', icon: BarChart3 },
    { to: '/disease', label: 'Disease Scanner', icon: ShieldAlert },
    { to: '/schemes', label: 'Gov Schemes', icon: Landmark },
    { to: '/analytics', label: 'Soil Analytics', icon: TrendingUp },
  ];

  const bottomNavItems = [
    { to: '/profile', label: 'Farm Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const NavItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) => (
    <NavLink
      to={to}
      title={sidebarCollapsed ? label : undefined}
      className={({ isActive }) => 
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
          isActive 
            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' 
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`
      }
    >
      <Icon className="w-4.5 h-4.5 flex-shrink-0" />
      {!sidebarCollapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="truncate leading-none"
        >
          {label}
        </motion.span>
      )}
    </NavLink>
  );

  const SectionLabel = ({ label }: { label: string }) => (
    !sidebarCollapsed ? (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest px-3 pt-3 pb-1"
      >
        {label}
      </motion.p>
    ) : (
      <div className="border-t border-zinc-200 dark:border-zinc-800/60 my-2 mx-2" />
    )
  );

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex-shrink-0 h-screen bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 flex flex-col overflow-hidden relative sticky top-0"
    >
      {/* Top Header Section */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 flex-shrink-0">
              <Sprout className="w-4.5 h-4.5" />
            </div>
            {!sidebarCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight truncate"
              >
                KrishiMitra <span className="text-emerald-600 dark:text-emerald-400">AI</span>
              </motion.span>
            )}
          </div>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-6 h-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 absolute -right-3 top-6 bg-white dark:bg-zinc-950 z-20 shadow-sm flex-shrink-0"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2">
        
        {/* Core Navigation */}
        <SectionLabel label="Core" />
        <nav className="flex flex-col gap-1">
          {coreNavItems.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>

        {/* Agricultural Tools */}
        <SectionLabel label="Agri Tools" />
        <nav className="flex flex-col gap-1">
          {toolNavItems.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>

        {/* Recent Sessions (only expanded) */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3"
          >
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                <History className="w-3 h-3" /> Recent
              </span>
              <button
                onClick={() => { if (window.confirm('Wipe conversation history?')) clearSessions(); }}
                className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition p-0.5 rounded"
                title="Clear all history"
                aria-label="Clear conversation history"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => createNewSession().then(() => navigate('/chat'))}
              className="flex items-center justify-center gap-1.5 w-full py-2 mb-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-700 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 text-[11px] font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" /> New Consultation
            </button>

            <div className="space-y-0.5 max-h-[160px] overflow-y-auto pr-0.5">
              {sessions.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => { setCurrentSessionId(sess.id); navigate('/chat'); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition truncate flex items-center gap-2 ${
                    currentSessionId === sess.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <MessageSquare className="w-3 h-3 flex-shrink-0 opacity-60" />
                  <span className="truncate">{sess.name || 'Consultation'}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Fixed Section */}
      <div className="flex-shrink-0 px-3 pb-2 border-t border-zinc-200 dark:border-zinc-900 pt-2">
        <nav className="flex flex-col gap-1">
          {bottomNavItems.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>
      </div>

      {/* Footer Profile */}
      <div className="flex-shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-950/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white font-bold text-[11px] shadow-sm flex-shrink-0 cursor-pointer"
            title={userId}
          >
            {userId.substring(0, 2).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden min-w-0"
            >
              <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">{userId}</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium leading-tight mt-0.5">Farmer · Active</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
