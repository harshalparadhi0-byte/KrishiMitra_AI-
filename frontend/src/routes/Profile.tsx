import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import type { FarmProfile } from '../types';
import {
  MapPin, Leaf, Droplet, FlaskConical, PenSquare,
  Save, RotateCcw, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Section Wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
      <Icon className="w-4 h-4 text-emerald-600" />
      <h2 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
);

// ─── Input ─────────────────────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition';

// ─── Main Profile Component ────────────────────────────────────────────────────
export const Profile = () => {
  const { profile, updateProfile, isLoading } = useAppState();
  const [form, setForm] = useState<FarmProfile | null>(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if profile loads after component mount
  if (profile && !form) setForm(profile);

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const update = (key: keyof FarmProfile, value: unknown) =>
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);

  const updateNpk = (key: 'N' | 'P' | 'K', value: number) =>
    setForm((prev) => prev ? { ...prev, soil_npk: { ...prev.soil_npk, [key]: value } } : prev);

  const handleCropsChange = (raw: string) =>
    update('crops', raw.split(',').map((s) => s.trim()).filter(Boolean));

  const handleSave = async () => {
    if (!form) return;
    setError(null);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError('Failed to save profile. Please try again.');
    }
  };

  const handleReset = () => {
    setForm(profile);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <PenSquare className="w-6 h-6 text-emerald-600" /> Farm Profile
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your farm's data. The AI agents use this profile to personalize every recommendation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition border border-zinc-200 dark:border-zinc-800"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 transition shadow-md"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </div>
      </div>

      {/* Status banners */}
      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Profile saved successfully! AI agents will use your updated data for all future queries.
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* ── Location ─────────────────────────────────────────────────────────── */}
      <Section title="Farm Location" icon={MapPin}>
        <Field label="Location / Village / District">
          <input
            className={inputCls}
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="e.g. Nashik, Maharashtra"
          />
        </Field>
      </Section>

      {/* ── Crops ───────────────────────────────────────────────────────────── */}
      <Section title="Crops & Farming" icon={Leaf}>
        <div className="space-y-4">
          <Field label="Active Crops (comma-separated)">
            <input
              className={inputCls}
              value={form.crops.join(', ')}
              onChange={(e) => handleCropsChange(e.target.value)}
              placeholder="e.g. Tomato, Wheat, Onion"
            />
          </Field>
          <Field label="Irrigation Method">
            <select
              className={inputCls}
              value={form.irrigation_method}
              onChange={(e) => update('irrigation_method', e.target.value)}
            >
              {['Drip Irrigation', 'Sprinkler', 'Flood Irrigation', 'Furrow', 'Rain-fed', 'Micro-irrigation'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Preferred Language">
            <select
              className={inputCls}
              value={form.preferred_language}
              onChange={(e) => update('preferred_language', e.target.value)}
            >
              {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Bengali', 'Punjabi'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Soil Health ─────────────────────────────────────────────────────── */}
      <Section title="Soil Health Data" icon={FlaskConical}>
        <div className="space-y-4">
          {/* NPK sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['N', 'P', 'K'] as const).map((key) => {
              const labels = { N: 'Nitrogen (N)', P: 'Phosphorus (P)', K: 'Potassium (K)' };
              const colors = { N: 'accent-emerald-600', P: 'accent-amber-500', K: 'accent-indigo-600' };
              const val = form.soil_npk[key];
              return (
                <div key={key} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{labels[key]}</span>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{val} <span className="text-xs text-zinc-400">mg/kg</span></span>
                  </div>
                  <input
                    type="range" min={0} max={120} value={val}
                    onChange={(e) => updateNpk(key, Number(e.target.value))}
                    className={`w-full h-2 rounded-full cursor-pointer ${colors[key]}`}
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>0</span><span>60</span><span>120</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Soil pH (4.0 – 9.0)">
              <div className="flex items-center gap-3">
                <input
                  type="range" min={4} max={9} step={0.1} value={form.soil_ph}
                  onChange={(e) => update('soil_ph', Number(e.target.value))}
                  className="flex-1 h-2 rounded-full cursor-pointer accent-emerald-600"
                />
                <span className={`text-sm font-bold min-w-[36px] text-right ${
                  form.soil_ph >= 6 && form.soil_ph <= 7.5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>{form.soil_ph.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                {form.soil_ph >= 6 && form.soil_ph <= 7.5 ? '✅ Optimal range for most crops' : '⚠️ Outside optimal range (6.0–7.5)'}
              </p>
            </Field>

            <Field label="Soil Texture">
              <select
                className={inputCls}
                value={form.soil_texture}
                onChange={(e) => update('soil_texture', e.target.value)}
              >
                {['Sandy', 'Loamy', 'Clay', 'Loamy Clay', 'Silty', 'Sandy Loam', 'Silty Clay', 'Peaty', 'Chalky'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── AI Memory ───────────────────────────────────────────────────────── */}
      <Section title="AI Memory — Past Recommendations" icon={Droplet}>
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {form.previous_recommendations.length > 0 ? (
            form.previous_recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{rec}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-600">
              <Leaf className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No recommendations stored. Start a chat session to generate AI advice.</p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
};
