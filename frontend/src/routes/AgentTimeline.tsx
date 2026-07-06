import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Zap, CheckCircle2, Clock, ArrowRight, RefreshCw, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface AgentStep {
  id: string;
  name: string;
  icon: string;
  status: 'pending' | 'running' | 'completed' | 'skipped';
  duration?: number; // ms
  description: string;
  color: string;
}

const MOCK_PIPELINE: AgentStep[] = [
  {
    id: 'ci', name: 'Conversation Intelligence', icon: '💬', status: 'completed',
    duration: 340, description: 'Classified query intent as agricultural. Routing to specialist pipeline.',
    color: 'emerald'
  },
  {
    id: 'security', name: 'Security Checkpoint', icon: '🛡️', status: 'completed',
    duration: 120, description: 'Query sanitised. No PII detected. No prompt injection. Safe to proceed.',
    color: 'amber'
  },
  {
    id: 'planner', name: 'Task Planner Agent', icon: '🧠', status: 'completed',
    duration: 580, description: 'Dispatching: Soil Health, Weather Intelligence, Crop Recommendation.',
    color: 'blue'
  },
  {
    id: 'soil', name: 'Soil Health Agent', icon: '🌱', status: 'completed',
    duration: 1240, description: 'NPK analysis complete. Nitrogen slightly deficient at 45 mg/kg.',
    color: 'green'
  },
  {
    id: 'weather', name: 'Weather Intelligence Agent', icon: '⛅', status: 'completed',
    duration: 890, description: '72% humidity, 28°C. Heavy rain forecast in 48h. Delay irrigation.',
    color: 'sky'
  },
  {
    id: 'crop', name: 'Crop Recommendation Agent', icon: '🌾', status: 'completed',
    duration: 1100, description: 'Based on NPK and pH 6.5: Tomato and Wheat are optimal this season.',
    color: 'amber'
  },
  {
    id: 'disease', name: 'Disease Diagnosis Agent', icon: '🔬', status: 'skipped',
    description: 'Not required for this query type.',
    color: 'rose'
  },
  {
    id: 'synth', name: 'Decision Synthesizer', icon: '📋', status: 'completed',
    duration: 760, description: 'Merged 3 agent outputs, resolved 1 conflict, generated confidence score 87%.',
    color: 'purple'
  },
];

const statusConfig = {
  pending: { label: 'Pending', dotClass: 'bg-zinc-300 dark:bg-zinc-600', textClass: 'text-zinc-400 dark:text-zinc-500' },
  running: { label: 'Running', dotClass: 'bg-blue-500 animate-pulse', textClass: 'text-blue-600 dark:text-blue-400' },
  completed: { label: 'Completed', dotClass: 'bg-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-400' },
  skipped: { label: 'Skipped', dotClass: 'bg-zinc-300 dark:bg-zinc-700', textClass: 'text-zinc-400 dark:text-zinc-500 line-through' },
};

export const AgentTimeline = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const completedSteps = MOCK_PIPELINE.filter((s) => s.status === 'completed');
  const totalDuration = completedSteps.reduce((acc, s) => acc + (s.duration ?? 0), 0);
  const avgConfidence = 87;

  const simulateRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-blue-500" /> Agent Execution Timeline
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Visualize how the multi-agent pipeline processes your farming queries
          </p>
        </div>
        <button
          onClick={simulateRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 transition shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Simulating...' : 'Simulate Run'}
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Agents', value: MOCK_PIPELINE.length, icon: BrainCircuit, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Agents Activated', value: completedSteps.length, icon: Zap, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total Duration', value: `${(totalDuration / 1000).toFixed(2)}s`, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'AI Confidence', value: `${avgConfidence}%`, icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-800 dark:text-zinc-100">Pipeline Execution Trace</h2>
        </div>
        <div className="p-4 space-y-0.5">
          {MOCK_PIPELINE.map((step, idx) => {
            const { label, dotClass, textClass } = statusConfig[step.status];
            const isOpen = expanded === step.id;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : step.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/80 transition text-left group"
                >
                  {/* Step connector line */}
                  <div className="flex flex-col items-center self-stretch">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${dotClass}`} />
                    {idx < MOCK_PIPELINE.length - 1 && (
                      <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-800 mt-1" />
                    )}
                  </div>

                  {/* Step info */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{step.icon}</span>
                      <span className={`font-semibold text-sm ${step.status === 'skipped' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {step.name}
                      </span>
                      <span className={`text-xs font-medium ${textClass}`}>{label}</span>
                      {step.duration && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
                          {step.duration}ms
                        </span>
                      )}
                    </div>

                    {/* Duration bar */}
                    {step.duration && (
                      <div className="mt-2 w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden max-w-xs">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (step.duration / 1500) * 100)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 + 0.2 }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    )}

                    {/* Expanded description */}
                    {isOpen && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 pr-4 leading-relaxed"
                      >
                        {step.description}
                      </motion.p>
                    )}
                  </div>

                  <ArrowRight className={`w-4 h-4 text-zinc-300 dark:text-zinc-700 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Ready to run a real analysis?</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Start a chat session to see this pipeline execute live with your actual farm data.</p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold whitespace-nowrap transition shadow-md"
        >
          Open Chat <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
