import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Landmark, Search, BarChart3,
  MapPin, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export const MarketIntelligence = () => {
  const [search, setSearch] = useState('');

  const mandiPrices = [
    { crop: 'Tomato', market: 'Pune APMC', price: 2400, unit: 'Quintal', change: 12.5, trend: 'up', volume: '120 Tonnes', quality: 'Grade A', advice: 'Prices are rising due to temporary supply shortage. Good time to harvest and sell immediately.' },
    { crop: 'Sugarcane', market: 'Kolhapur Mandi', price: 3150, unit: 'Tonne', change: 2.1, trend: 'up', volume: '500 Tonnes', quality: 'FRP standard', advice: 'Steady government-backed pricing. Keep supply aligned with sugar mill schedules.' },
    { crop: 'Onion', market: 'Lasalgaon (Nashik)', price: 1850, unit: 'Quintal', change: -5.4, trend: 'down', volume: '1500 Tonnes', quality: 'Red Onion', advice: 'Heavy arrivals leading to price drop. Consider storing in dry ventilated storage (Kanda Chawl) for 3-4 weeks.' },
    { crop: 'Wheat', market: 'Nagpur APMC', price: 2250, unit: 'Quintal', change: 0.8, trend: 'up', volume: '80 Tonnes', quality: 'Lokwan', advice: 'Prices stable around MSP. Recommended to sell at local APMC to save on transport costs.' },
  ];

  const filteredPrices = mandiPrices.filter(
    (item) =>
      item.crop.toLowerCase().includes(search.toLowerCase()) ||
      item.market.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" /> Mandi Market Intelligence
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Live prices, trends and storage recommendations from major agricultural markets.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search crop or market..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 transition shadow-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Mandi Prices list */}
        <div className="lg:col-span-2 space-y-4">
          {filteredPrices.length > 0 ? (
            filteredPrices.map((item, idx) => (
              <motion.div
                key={item.crop}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all group"
              >
                {/* Crop details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-zinc-800 dark:text-zinc-150">{item.crop}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.trend === 'up'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                    }`}>
                      {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {item.trend === 'up' ? '+' : ''}{item.change}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-555 dark:text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {item.market}
                  </p>
                </div>

                {/* Price block */}
                <div className="md:text-right">
                  <p className="text-xl font-black text-zinc-900 dark:text-white">
                    ₹{item.price.toLocaleString('en-IN')}{' '}
                    <span className="text-xs text-zinc-450 font-medium">/ {item.unit}</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Vol: {item.volume} · {item.quality}
                  </p>
                </div>

                {/* Storage advice / Sell advice */}
                <div className="border-t md:border-t-0 md:border-l border-zinc-150 dark:border-zinc-800/80 pt-3 md:pt-0 md:pl-5 flex-1 max-w-sm">
                  <p className="text-[11px] text-zinc-550 dark:text-zinc-400 leading-relaxed italic">
                    "{item.advice}"
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <Search className="w-8 h-8 text-zinc-300 dark:text-zinc-705 mx-auto mb-2" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold">No crop matches found</p>
            </div>
          )}
        </div>

        {/* Right: Insights card */}
        <div className="space-y-6">
          
          {/* Sell Advisory recommendation */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm"
          >
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Best Time to Sell
            </h3>
            
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Tomato harvest is recommended now</p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-450 mt-1 leading-relaxed">
                  Price hike expected to plateau this weekend. Early harvest of Grade A crops is advised.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Hold Onion storage</p>
                <p className="text-[11px] text-amber-700/80 dark:text-emerald-450 mt-1 leading-relaxed">
                  Avoid selling during the current surplus influx. Store dry red onions for higher margins in August.
                </p>
              </div>
            </div>
          </motion.div>

          {/* MSP info */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm"
          >
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-500" /> MSP Guidelines 2026
            </h3>
            <p className="text-[11px] text-zinc-400 mb-4">Minimum Support Prices set by Government of India</p>

            <div className="space-y-3">
              {[
                { name: 'Wheat (Common)', MSP: 2275, year: '2025-26' },
                { name: 'Sugarcane (Fair Price)', MSP: 315, year: 'Per Quintal' },
                { name: 'Onion (Estimated floor)', MSP: 1750, year: '2025-26' },
              ].map((msp) => (
                <div key={msp.name} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80">
                  <div>
                    <p className="font-semibold text-zinc-705 dark:text-zinc-300">{msp.name}</p>
                    <p className="text-[9px] text-zinc-400 mt-0.5">{msp.year}</p>
                  </div>
                  <span className="font-black text-zinc-800 dark:text-zinc-100">₹{msp.MSP}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
