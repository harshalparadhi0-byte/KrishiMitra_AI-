import {
  BarChart3, FlaskConical, Droplet, Sprout,
  Activity, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Analytics = () => {
  const monthlyNPK = [
    { month: 'Mar', N: 30, P: 25, K: 35 },
    { month: 'Apr', N: 35, P: 27, K: 38 },
    { month: 'May', N: 40, P: 28, K: 39 },
    { month: 'Jun', N: 45, P: 30, K: 40 }, // current
  ];

  const moisture30Days = [
    { date: '1-10 Jun', avg: 45, status: 'Optimal' },
    { date: '11-20 Jun', avg: 38, status: 'Dry' },
    { date: '21-30 Jun', avg: 42, status: 'Optimal' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-500" /> Soil & Farm Analytics
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Historical trends, soil macronutrients fluctuation, and farm productivity indicators.
        </p>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* NPK Timeline trend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-600" /> NPK Nutrition History
            </h3>
            <p className="text-[10px] text-zinc-400 mb-6">Macronutrient trends over last 4 months (mg/kg)</p>

            <div className="space-y-4">
              {monthlyNPK.map((item) => (
                <div key={item.month} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-500 min-w-[36px]">{item.month}</span>
                  <div className="flex-1 flex gap-1.5 h-4 items-end px-3">
                    <div className="bg-emerald-500 rounded-sm w-3" style={{ height: `${(item.N / 60) * 100}%` }} title={`N: ${item.N}`} />
                    <div className="bg-amber-500 rounded-sm w-3" style={{ height: `${(item.P / 60) * 100}%` }} title={`P: ${item.P}`} />
                    <div className="bg-indigo-500 rounded-sm w-3" style={{ height: `${(item.K / 60) * 100}%` }} title={`K: ${item.K}`} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500">
                    {item.N}-{item.P}-{item.K}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-4 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> N</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> P</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500" /> K</span>
          </div>
        </motion.div>

        {/* Moisture timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-500" /> Moisture Retention
            </h3>
            <p className="text-[10px] text-zinc-400 mb-6">Average soil moisture levels in June</p>

            <div className="space-y-4">
              {moisture30Days.map((item) => (
                <div key={item.date} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">{item.date}</p>
                    <p className="text-[9px] text-zinc-450">{item.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-800 dark:text-zinc-105">{item.avg}%</p>
                    <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.avg}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Checked daily by soil sensor networks.
          </div>
        </motion.div>

        {/* Yield estimates */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-500" /> Crop Yield Forecast
            </h3>
            <p className="text-[10px] text-zinc-400 mb-5">Calculated based on current NPK deficiencies & pH indices</p>

            <div className="space-y-3.5">
              {[
                { crop: 'Tomato', health: 88, estimate: '24-26 Tonnes / Acre', trend: 'Optimal conditions' },
                { crop: 'Sugarcane', health: 76, estimate: '35-38 Tonnes / Acre', trend: 'Nitrogen deficiency' },
              ].map((c) => (
                <div key={c.crop} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-bold text-zinc-700 dark:text-zinc-355">{c.crop}</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{c.health}% Health Index</span>
                  </div>
                  <p className="text-xs font-black text-zinc-805 dark:text-white">{c.estimate}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">{c.trend}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20 px-2 py-1 rounded">
            <Sparkles className="w-3.5 h-3.5" /> High accuracy prediction module.
          </div>
        </motion.div>
      </div>
    </div>
  );
};
