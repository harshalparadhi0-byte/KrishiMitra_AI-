import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { Landmark, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const GovernmentSchemes = () => {
  const { profile } = useAppState();
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);

  const schemes = [
    {
      id: 'pmksy',
      title: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',
      subsidy: '55% - 80% Subsidy',
      type: 'Irrigation Technology',
      target: 'Drip & Sprinkler Micro-irrigation',
      eligibility: 'All farmers owning land. Higher subsidy for small/marginal farmers.',
      benefits: 'Financial support for installing drip systems, water storage farm ponds, and tube well recharge structures.',
      steps: [
        'Apply online at your state micro-irrigation portal.',
        'Upload Land Title (7/12 extract), Aadhaar Card, and Bank details.',
        'Authorized vendor visits farm to prepare irrigation design and estimate.',
        'Subsidy approved and credited to vendor/farmer account after field verification.'
      ],
      matched: profile?.irrigation_method === 'Drip Irrigation',
      matchReason: 'Matched because your profile irrigation method is set to Drip Irrigation.'
    },
    {
      id: 'pmfby',
      title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      subsidy: 'Low Premium Crop Insurance',
      type: 'Risk Management',
      target: 'Cereal, Oilseed, & Horticultural Crops',
      eligibility: 'All farmers growing notified crops in notified areas.',
      benefits: 'Comprehensive insurance cover against crop loss due to drought, floods, pests & diseases. Premium capped at 1.5%-2% for foodgrain crops.',
      steps: [
        'Apply through nearest CSC (Common Service Center) or local cooperative bank.',
        'Provide sowing certificate, land possession document, and bank passbook.',
        'Pay standard premium contribution.',
        'Insurer issues insurance certificate linked to your farm plot.'
      ],
      matched: (profile?.crops.length ?? 0) > 0,
      matchReason: `Matched for your registered crops: ${profile?.crops.join(', ')}.`
    },
    {
      id: 'shc',
      title: 'Soil Health Card Scheme',
      subsidy: '100% Free Testing',
      type: 'Soil Nutrition',
      target: 'NPK, pH, & Micronutrients analysis',
      eligibility: 'All land-owning farmers in India.',
      benefits: 'Provides free soil testing and fertilizer recommendation card every 2 years. Helps farmers reduce chemical fertilizer inputs.',
      steps: [
        'Contact nearest block agriculture officer or village coordinator.',
        'Agriculture department collects soil samples from your farm plot.',
        'Sample tested at state soil testing lab.',
        'Soil Health Card issued showing NPK deficiencies and gypsum/lime requirements.'
      ],
      matched: true,
      matchReason: 'Matched to optimize your soil NPK levels: ' + (profile ? `N:${profile.soil_npk.N} P:${profile.soil_npk.P} K:${profile.soil_npk.K}` : '')
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Landmark className="w-6 h-6 text-emerald-600" /> Government Schemes & Subsidies
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Personalized recommendations for central and state agriculture subsidies matching your profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Schemes List */}
        <div className="lg:col-span-2 space-y-4">
          {schemes.map((scheme, idx) => (
            <motion.div
              key={scheme.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedScheme(scheme.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                selectedScheme === scheme.id
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 hover:shadow-sm'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    {scheme.type}
                  </span>
                  {scheme.matched && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                      🎯 Profile Match
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-105">
                  {scheme.title}
                </h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Target: {scheme.target}
                </p>
              </div>

              <div className="md:text-right flex-shrink-0">
                <p className="font-black text-sm text-emerald-600 dark:text-emerald-400">{scheme.subsidy}</p>
                <p className="text-[10px] text-zinc-400 mt-1 flex items-center md:justify-end gap-1">
                  Click to view steps <ChevronRight className="w-3.5 h-3.5" />
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right: Step-by-Step details */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedScheme ? (
              (() => {
                const current = schemes.find((s) => s.id === selectedScheme)!;
                return (
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-4"
                  >
                    <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                        {current.title}
                      </h3>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">{current.subsidy}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs">
                        <span className="font-semibold text-zinc-400 block uppercase text-[9px]">Eligibility</span>
                        <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">{current.eligibility}</p>
                      </div>

                      <div className="text-xs">
                        <span className="font-semibold text-zinc-400 block uppercase text-[9px]">Benefits</span>
                        <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">{current.benefits}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
                      <span className="font-semibold text-zinc-400 block uppercase text-[9px]">Application Process</span>
                      <div className="space-y-2">
                        {current.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-2.5 text-xs">
                            <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-zinc-650 dark:text-zinc-405 leading-normal">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {current.matched && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 text-[10px] text-emerald-800 dark:text-emerald-450 leading-relaxed">
                        <strong>Match Note:</strong> {current.matchReason}
                      </div>
                    )}
                  </motion.div>
                );
              })()
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]"
              >
                <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-xs font-semibold text-zinc-650 dark:text-zinc-405">Scheme Detail Window</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px]">
                  Select any scheme on the left to see subsidy details, eligibility requirements, and the step-by-step application process.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
