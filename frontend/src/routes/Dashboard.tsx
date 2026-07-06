import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppContext';
import {
  Sprout, ThermometerSun, Leaf, Droplet, TrendingUp, MessageSquare,
  CloudRain, AlertTriangle, CheckCircle2, ArrowRight,
  Zap, Activity, Clock, BarChart3, Shield, BrainCircuit, User
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Mini Components ──────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon, label, value, color, delay = 0
}: { icon: React.ElementType; label: string; value: string; color: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
  >
    <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>
      <p className="text-base font-bold text-zinc-800 dark:text-zinc-100 truncate">{value}</p>
    </div>
  </motion.div>
);

const WeatherCard = ({ icon, label, value, unit, color }: {
  icon: string; label: string; value: string | number; unit: string; color: string;
}) => (
  <div className={`flex flex-col items-center p-4 rounded-xl ${color} text-center`}>
    <span className="text-2xl mb-1">{icon}</span>
    <p className="text-lg font-bold">{value}<span className="text-xs ml-0.5">{unit}</span></p>
    <p className="text-xs opacity-75 font-medium">{label}</p>
  </div>
);

const AgentStatusBadge = ({ name, status, icon }: { name: string; status: 'ready' | 'active' | 'idle'; icon: string }) => {
  const colors = {
    ready: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    active: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    idle: 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  };
  const dots = {
    ready: 'bg-emerald-500',
    active: 'bg-blue-500 animate-pulse',
    idle: 'bg-zinc-400',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${colors[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      <span>{icon} {name}</span>
    </div>
  );
};

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export const Dashboard = () => {
  const { profile, alertCount, alertsText } = useAppState();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading farm data...</p>
      </div>
    );
  }

  const agents = [
    { name: 'Orchestrator', icon: '🧠', status: 'ready' as const },
    { name: 'Soil Health', icon: '🌱', status: 'ready' as const },
    { name: 'Weather Intel', icon: '⛅', status: 'ready' as const },
    { name: 'Crop Advisor', icon: '🌾', status: 'ready' as const },
    { name: 'Disease Scan', icon: '🔬', status: 'idle' as const },
    { name: 'Market Intel', icon: '📊', status: 'idle' as const },
    { name: 'Gov. Schemes', icon: '🏛️', status: 'idle' as const },
    { name: 'Irrigation AI', icon: '💧', status: 'idle' as const },
  ];

  const quickActions = [
    {
      title: 'Ask AI Assistant',
      desc: 'Chat with your multi-agent farming advisor',
      icon: MessageSquare,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      route: '/chat',
    },
    {
      title: 'Disease Diagnosis',
      desc: 'Describe symptoms for instant analysis',
      icon: Shield,
      color: 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900',
      route: '/chat',
      prompt: 'Diagnose disease symptoms on my crops',
    },
    {
      title: 'Market Prices',
      desc: 'Check current mandi rates for your crops',
      icon: BarChart3,
      color: 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
      route: '/chat',
    },
    {
      title: 'Update Farm Profile',
      desc: 'Edit NPK, pH and location data',
      icon: User,
      color: 'bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800',
      route: '/profile',
    },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* ── Hero Welcome Banner ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 p-6 md:p-8 text-white shadow-xl shadow-emerald-900/20"
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute right-1/3 bottom-0 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl" />
          <div className="absolute left-0 bottom-0 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Multi-Agent System Online
              </span>
              <span className="text-xs text-emerald-200 opacity-70">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              {timeGreeting()}, Farmer 🌾
            </h1>
            <p className="text-emerald-100/80 text-sm md:text-base leading-relaxed">
              Your AI agricultural operating system is active. All specialist agents are ready to analyze your farm data and provide expert recommendations.
            </p>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm shadow-lg hover:bg-emerald-50 transition-all hover:shadow-xl"
            >
              <BrainCircuit className="w-4 h-4" />
              Ask AI Now
            </button>
            {alertCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/80 text-white text-sm font-semibold border border-rose-400/50">
                <AlertTriangle className="w-4 h-4" />
                {alertCount} Alert{alertCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Quick Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ThermometerSun} label="Farm Location" value={profile.location} color="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" delay={0.05} />
        <StatCard icon={Leaf} label="Active Crops" value={profile.crops.join(', ') || '—'} color="bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" delay={0.1} />
        <StatCard icon={Droplet} label="Irrigation" value={profile.irrigation_method} color="bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" delay={0.15} />
        <StatCard icon={TrendingUp} label="Soil pH" value={`${profile.soil_ph} pH`} color="bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400" delay={0.2} />
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COL (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Weather Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-500" /> Weather Intelligence
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Live conditions for {profile.location}</p>
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Updated just now
              </span>
            </div>
            <div className="p-6">
              {/* Current conditions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <WeatherCard icon="🌡️" label="Temperature" value="28" unit="°C" color="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300" />
                <WeatherCard icon="💧" label="Humidity" value="72" unit="%" color="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" />
                <WeatherCard icon="🌬️" label="Wind Speed" value="12" unit="km/h" color="bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300" />
                <WeatherCard icon="☔" label="Rain Risk" value="35" unit="%" color="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300" />
              </div>

              {/* 5-Day Forecast */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">5-Day Forecast</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { day: 'Today', icon: '☀️', high: 30, low: 22 },
                    { day: 'Sat', icon: '⛅', high: 28, low: 21 },
                    { day: 'Sun', icon: '🌦️', high: 26, low: 20 },
                    { day: 'Mon', icon: '🌧️', high: 24, low: 19 },
                    { day: 'Tue', icon: '⛅', high: 27, low: 21 },
                  ].map((d) => (
                    <div key={d.day} className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 min-w-[72px] text-center">
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{d.day}</span>
                      <span className="text-xl">{d.icon}</span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{d.high}°</span>
                      <span className="text-[10px] text-zinc-400">{d.low}°</span>
                    </div>
                  ))}
                </div>
              </div>

              {alertsText && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{alertsText.split('\n')[0]}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm"
          >
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
              </h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    onClick={() => navigate(action.route)}
                    className={`flex items-center gap-3.5 p-4 rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group ${action.color}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{action.title}</p>
                      <p className="text-xs opacity-70 mt-0.5 leading-tight">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COL (1/3) */}
        <div className="space-y-6">

          {/* Soil NPK Status */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm p-6"
          >
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Soil NPK Status
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">Macronutrient levels (mg/kg)</p>

            <div className="space-y-4">
              {[
                { label: 'Nitrogen (N)', val: profile.soil_npk.N, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Phosphorus (P)', val: profile.soil_npk.P, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
                { label: 'Potassium (K)', val: profile.soil_npk.K, color: 'bg-indigo-500', textColor: 'text-indigo-600 dark:text-indigo-400' },
              ].map(({ label, val, color, textColor }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
                    <span className={`font-bold text-sm ${textColor}`}>{val}</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (val / 120) * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                      className={`h-full ${color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                <p className="text-zinc-400 mb-0.5">Soil Texture</p>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">{profile.soil_texture}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                <p className="text-zinc-400 mb-0.5">pH Level</p>
                <p className={`font-bold ${profile.soil_ph >= 6 && profile.soil_ph <= 7.5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {profile.soil_ph}
                </p>
              </div>
            </div>
          </motion.div>

          {/* AI Agents Status */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm p-6"
          >
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-blue-500" /> Agent Network
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Specialist AI agent availability</p>

            <div className="flex flex-wrap gap-2">
              {agents.map((a) => (
                <AgentStatusBadge key={a.name} name={a.name} status={a.status} icon={a.icon} />
              ))}
            </div>

            <button
              onClick={() => navigate('/chat')}
              className="mt-5 w-full py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Start Consultation
            </button>
          </motion.div>

          {/* AI Memory — Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm p-6"
          >
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AI Memory
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Persistent farm advice from prior sessions</p>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {profile.previous_recommendations.length > 0 ? (
                profile.previous_recommendations.map((rec, i) => (
                  <div key={i} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{rec}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-600 text-center">
                  <Sprout className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs">No advice stored yet.</p>
                  <p className="text-xs mt-1">Start a chat session to generate AI recommendations.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
