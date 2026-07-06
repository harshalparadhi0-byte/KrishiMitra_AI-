import { useState } from 'react';
import {
  ShieldAlert, Upload, RefreshCw,
  Bug, Sparkles, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DiseaseDetection = () => {
  const [scanning, setScanning] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [results, setResults] = useState<any | null>(null);

  const symptomOptions = [
    { id: 'yellow_spots', label: 'Yellow spots on leaves' },
    { id: 'concentric_rings', label: 'Dark brown spots with concentric rings' },
    { id: 'white_powdery', label: 'White powdery coating on surface' },
    { id: 'curled_leaves', label: 'Curled or distorted leaf shapes' },
    { id: 'wilting_stems', label: 'Sudden wilting of stems/branches' },
    { id: 'fruit_spots', label: 'Dark sunken spots on fruit' },
  ];

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleScan = () => {
    if (selectedSymptoms.length === 0) return;
    setScanning(true);
    setResults(null);

    setTimeout(() => {
      setScanning(false);
      // Determine mock result based on symptoms
      if (selectedSymptoms.includes('concentric_rings') || selectedSymptoms.includes('yellow_spots')) {
        setResults({
          diseaseName: 'Early Blight (Alternaria solani)',
          crop: 'Tomato',
          confidence: 94,
          severity: 'Moderate',
          description: 'A common fungal pathogen causing spotting and ring patterns on leaves, eventually defoliating the plant and lowering yield.',
          biologicalControl: 'Apply neem oil sprays. Ensure wide spacing to increase air ventilation and reduce moisture build-up.',
          chemicalControl: 'Apply copper-based fungicides or Mancozeb sprays if symptoms spread past lower leaves.',
          prevention: 'Practice crop rotation (avoid Solanaceous crops next season), water at soil level rather than overhead, and clean garden debris.',
        });
      } else if (selectedSymptoms.includes('white_powdery')) {
        setResults({
          diseaseName: 'Powdery Mildew (Podosphaera spp.)',
          crop: 'Multiple Crops',
          confidence: 89,
          severity: 'Mild',
          description: 'A fungal disease that creates a flour-like white dusting on leaves, blocking photosynthesis and weakening plant vigor.',
          biologicalControl: 'Spray potassium bicarbonate solution or diluted milk solution (1:9 ratio with water) on infected leaves.',
          chemicalControl: 'Sulfur-based fungicides or triadimefon if infection covers more than 20% of leaf area.',
          prevention: 'Prune dense foliage, water in morning to allow leaves to dry, select resistant seed varieties.',
        });
      } else {
        setResults({
          diseaseName: 'Tomato Leaf Curl Virus (TLCV)',
          crop: 'Tomato',
          confidence: 85,
          severity: 'Critical',
          description: 'Viral infection transmitted by Bemisia tabaci (whiteflies), causing leaf curling, dwarfing of leaves, and severe stunting.',
          biologicalControl: 'Install yellow sticky traps to capture whiteflies. Remove and destroy heavily infected crop plants to prevent vector spread.',
          chemicalControl: 'Chemical sprays do not cure viruses. Apply imidacloprid to control the whitefly vector populations.',
          prevention: 'Use whitefly-proof net barriers for seedling nurseries. Grow TLCV resistant hybrid varieties.',
        });
      }
    }, 2000);
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setResults(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" /> AI Disease Scanner
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Detect plant diseases immediately by selecting symptoms or simulating leaf uploads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Input parameters */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upload panel */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-rose-500" /> 1. Upload Leaf Photo
            </h3>
            
            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/20 hover:border-rose-400 dark:hover:border-rose-900 transition cursor-pointer group">
              <Upload className="w-8 h-8 text-zinc-400 group-hover:text-rose-500 transition mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Drag & drop plant leaf image here</p>
              <p className="text-[10px] text-zinc-400 mt-1">PNG, JPG, JPEG up to 5MB (Simulated)</p>
            </div>
          </div>

          {/* Symptom selector */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Bug className="w-4 h-4 text-amber-500" /> 2. Observe Crop Symptoms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {symptomOptions.map((opt) => {
                const active = selectedSymptoms.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleSymptom(opt.id)}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-3 ${
                      active
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 font-semibold text-rose-700 dark:text-rose-300'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955/30 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      active ? 'border-rose-500 bg-rose-500 text-white' : 'border-zinc-300 dark:border-zinc-700'
                    }`}>
                      {active && '✓'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleScan}
                disabled={selectedSymptoms.length === 0 || scanning}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50 transition shadow-md shadow-rose-900/10"
              >
                {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {scanning ? 'Analyzing symptoms...' : 'Analyze with Agri-AI'}
              </button>
              {selectedSymptoms.length > 0 && (
                <button
                  onClick={handleReset}
                  className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 text-sm font-semibold transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Results panel */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {scanning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]"
              >
                <div className="w-12 h-12 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin mb-4" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Scanning agricultural database...</p>
                <p className="text-xs text-zinc-400 mt-1">Cross-referencing disease patterns & weather vectors</p>
              </motion.div>
            )}

            {results && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-5"
              >
                {/* Identified disease title */}
                <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-955 text-rose-600 border border-rose-100 dark:border-rose-900">
                      Severity: {results.severity}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{results.confidence}% confidence</span>
                  </div>
                  <h3 className="font-extrabold text-zinc-900 dark:text-white leading-tight">
                    {results.diseaseName}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Detected on: {results.crop}</p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
                    {results.description}
                  </p>
                </div>

                {/* Control options */}
                <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Biological Control</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{results.biologicalControl}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Chemical Cure</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{results.chemicalControl}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Preventive Steps</p>
                    <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">{results.prevention}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!scanning && !results && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]"
              >
                <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Diagnosis Pending</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px]">
                  Select leaf observations on the left to trigger the AI Diagnosis node.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
