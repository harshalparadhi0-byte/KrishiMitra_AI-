import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import {
  CloudRain, Wind, Droplets, Sun,
  AlertTriangle, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export const WeatherDashboard = () => {
  const { profile, alertsText } = useAppState();
  const [selectedDay, setSelectedDay] = useState<number>(0);

  const forecast = [
    { day: 'Today', icon: '☀️', status: 'Sunny', temp: 30, low: 22, rain: 5, humidity: 60, wind: 12, uv: 8, soilTemp: 24, text: 'Clear sunny skies. High evaporation rates expected. Ensure drip irrigation is active.' },
    { day: 'Tomorrow', icon: '🌦️', status: 'Light Rain', temp: 28, low: 21, rain: 45, humidity: 82, wind: 16, uv: 4, soilTemp: 22, text: 'Heavy afternoon showers expected. Clay soil will retain moisture. Delay irrigation for 48 hours.' },
    { day: 'Sunday', icon: '🌧️', status: 'Heavy Rain', temp: 24, low: 20, rain: 80, humidity: 90, wind: 18, uv: 2, soilTemp: 20, text: 'Thunderstorms and heavy downpour. Risk of waterlogging. Check drainage channels in sugarcane fields.' },
    { day: 'Monday', icon: '⛅', status: 'Partly Cloudy', temp: 27, low: 21, rain: 15, humidity: 75, wind: 10, uv: 6, soilTemp: 21, text: 'Cloudy weather with mild breeze. Soil remains saturated. No immediate irrigation needed.' },
    { day: 'Tuesday', icon: '☀️', status: 'Mostly Sunny', temp: 29, low: 22, rain: 0, humidity: 65, wind: 8, uv: 7, soilTemp: 23, text: 'Sunny intervals. Good conditions for applying organic fertilizers and weeding.' },
  ];

  const current = forecast[selectedDay];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <CloudRain className="w-6 h-6 text-blue-500" /> Weather Intelligence Hub
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Hyper-local weather tracking and agricultural advisory for {profile?.location || 'your farm'}.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Current details (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Weather Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm overflow-hidden relative"
          >
            {/* Background design */}
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
              <div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Selected: {current.day}
                </span>
                <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-1.5">{current.status}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-5xl">{current.icon}</span>
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                  {current.temp}°C
                </span>
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                <CloudRain className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 font-semibold uppercase">Rain Risk</p>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{current.rain}%</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-905 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                <Droplets className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 font-semibold uppercase">Humidity</p>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{current.humidity}%</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-905 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                <Wind className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 font-semibold uppercase">Wind</p>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{current.wind} km/h</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-905 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 font-semibold uppercase">UV Index</p>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{current.uv} / 10</p>
                </div>
              </div>
            </div>

            {/* Smart Agricultural Advisory */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Agricultural Recommendation</p>
                <p className="text-xs text-blue-700/90 dark:text-blue-400 mt-1 leading-relaxed">{current.text}</p>
              </div>
            </div>
          </motion.div>

          {/* 5-Day Forecast Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">5-Day Outlook</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {forecast.map((f, i) => (
                <button
                  key={f.day}
                  onClick={() => setSelectedDay(i)}
                  className={`p-4 rounded-xl border transition-all text-center flex flex-col items-center gap-2 ${
                    selectedDay === i
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <span className="text-xs text-zinc-550 dark:text-zinc-400">{f.day}</span>
                  <span className="text-3xl my-1">{f.icon}</span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{f.temp}°</span>
                  <span className="text-[10px] text-zinc-450">{f.status}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Extra metrics (Soil Temperature, Moisture index, Alert list) */}
        <div className="space-y-6">
          
          {/* Soil Moisture Info */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm"
          >
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-emerald-600" /> Soil Hydration
            </h3>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500 font-medium">Estimated Soil Moisture</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">42% (Optimal)</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500 font-medium">Evapotranspiration Rate</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">4.5 mm/day</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                <p className="text-zinc-400 font-medium">Soil Temp</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{current.soilTemp}°C</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                <p className="text-zinc-400 font-medium">Spraying window</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Excellent</p>
              </div>
            </div>
          </motion.div>

          {/* Warnings List */}
          {alertsText && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10 p-6 shadow-sm"
            >
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Active Weather Warnings
              </h3>
              <div className="space-y-3">
                {alertsText.split('\n').filter(Boolean).map((alert, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-rose-100 dark:border-rose-950 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed flex gap-2.5">
                    <span className="flex-shrink-0 mt-0.5">⚠️</span>
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
