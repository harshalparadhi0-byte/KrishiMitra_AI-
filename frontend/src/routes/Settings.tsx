import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings as SettingsIcon, Moon, Sun, Monitor, User2, Bell, Shield,
  Trash2, CheckCircle2, ChevronRight, Loader2, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

const SectionHeader = ({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle: string;
}) => (
  <div className="flex items-start gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">{title}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { userId, setUserId, clearSessions, isLoading } = useAppState();

  const [editingUser, setEditingUser] = useState(false);
  const [tempUserId, setTempUserId] = useState(userId);
  const [notifications, setNotifications] = useState({ weather: true, disease: true, market: false, schemes: true });
  const [cleared, setCleared] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSaveUserId = () => {
    if (tempUserId.trim()) {
      setUserId(tempUserId.trim());
      setEditingUser(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    await clearSessions();
    setCleared(true);
    setConfirmClear(false);
    setTimeout(() => setCleared(false), 3000);
  };

  const themeOptions: Array<{ value: 'light' | 'dark' | 'system'; label: string; icon: React.ElementType }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-zinc-500" /> Settings
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your preferences, account, and notification settings.
        </p>
      </div>

      {/* ── Appearance ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden"
      >
        <SectionHeader icon={Sun} title="Appearance" subtitle="Choose your preferred color scheme for KrishiMitra AI." />
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold">{label}</span>
                {theme === value && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Account ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden"
      >
        <SectionHeader icon={User2} title="Farmer Identity" subtitle="Your unique user ID is used to isolate your farm data." />
        <div className="p-6">
          {editingUser ? (
            <div className="flex items-center gap-3">
              <input
                autoFocus
                value={tempUserId}
                onChange={(e) => setTempUserId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveUserId()}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                placeholder="Enter your farmer ID"
              />
              <button onClick={handleSaveUserId} className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition">
                Save
              </button>
              <button onClick={() => { setEditingUser(false); setTempUserId(userId); }} className="px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingUser(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                  {userId.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{userId}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Farmer ID · Click to edit</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition" />
            </button>
          )}
          <p className="flex items-start gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 mt-3">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Changing your Farmer ID will switch to a separate farm data profile. Your previous data will remain under the old ID.
          </p>
        </div>
      </motion.div>

      {/* ── Notifications ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden"
      >
        <SectionHeader icon={Bell} title="Proactive Alerts" subtitle="Choose which AI-generated alerts you want to receive." />
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {([
            { key: 'weather' as const, label: 'Weather Alerts', desc: 'Rain, storm, and extreme temperature warnings for your location' },
            { key: 'disease' as const, label: 'Crop Disease Risk', desc: 'Early warnings when humidity and temperature favor disease outbreaks' },
            { key: 'market' as const, label: 'Market Rate Updates', desc: 'Notable price movements in mandi rates for your crops' },
            { key: 'schemes' as const, label: 'Government Schemes', desc: 'New subsidies and schemes matching your farm profile' },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
              </div>
              <ToggleSwitch enabled={notifications[key]} onChange={(v) => setNotifications((prev) => ({ ...prev, [key]: v }))} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Privacy & Data ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden"
      >
        <SectionHeader icon={Shield} title="Privacy & Data" subtitle="Manage your conversation history and farm data." />
        <div className="p-6 space-y-3">
          {cleared && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" /> All conversation history has been cleared.
            </motion.div>
          )}
          <button
            onClick={handleClearHistory}
            disabled={isLoading}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition group ${
              confirmClear
                ? 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5 text-rose-500" />}
              <div className="text-left">
                <p className="text-sm font-medium">
                  {confirmClear ? '⚠️ Click again to confirm deletion' : 'Clear Conversation History'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Permanently removes all chat messages from the database</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>

          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Your farm profile (location, NPK, crops) is stored separately and is not deleted with conversation history.
          </p>
        </div>
      </motion.div>

      {/* ── About ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">KrishiMitra AI</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Multi-Agent Agricultural Intelligence Platform</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500">v2.0.0</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5">Google ADK · Gemini 2.5 Flash</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
