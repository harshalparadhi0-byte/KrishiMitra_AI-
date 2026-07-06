import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useAppState } from '../context/AppContext';
import { api } from '../services/api';
import {
  Send, Sprout, CornerDownLeft, Sparkles, RefreshCw,
  Copy, ThumbsUp, ThumbsDown, BrainCircuit,
  Leaf, CloudRain, ShieldCheck, BarChart3, BookOpen, Droplet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  state?: string; // e.g. "Planning", "Running", "Final Response"
  isStreaming?: boolean;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

// Maps internal ADK [STATE: X] values to user-friendly progress labels.
const STATE_UI: Record<string, { icon: string; label: string; color: string }> = {
  Security:      { icon: '🔒', label: 'Checking request…',              color: 'text-amber-600 dark:text-amber-400' },
  Planning:      { icon: '🧠', label: 'Understanding your question…',   color: 'text-blue-600 dark:text-blue-400' },
  Running:       { icon: '🌾', label: 'Consulting agricultural experts…', color: 'text-purple-600 dark:text-purple-400' },
  Completed:     { icon: '🌾', label: 'Consulting agricultural experts…', color: 'text-purple-600 dark:text-purple-400' },
  'Final Response': { icon: '✍️', label: 'Preparing final answer…',     color: 'text-emerald-600 dark:text-emerald-400' },
};

const AgentStateIndicator = ({ state }: { state: string }) => {
  const cfg = STATE_UI[state] ?? { icon: '⚙️', label: state, color: 'text-zinc-500 dark:text-zinc-400' };

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
      <span className="flex gap-0.5 ml-1">
        {[0, 0.15, 0.3].map((d) => (
          <span key={d} className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: `${d}s` }} />
        ))}
      </span>
    </div>
  );
};

const MessageBubble = memo(({
  message, onCopy, onFeedback
}: {
  message: Message;
  onCopy: (text: string) => void;
  onFeedback: (id: string, type: 'up' | 'down') => void;
}) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser
          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
          : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
      }`}>
        {isUser ? '👨‍🌾' : <Sprout className="w-4 h-4" />}
      </div>

      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Agent state indicator */}
        {!isUser && message.state && message.isStreaming && (
          <div className="mb-1.5 px-1">
            <AgentStateIndicator state={message.state} />
          </div>
        )}

        {/* Bubble */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-emerald-600 text-white rounded-tr-sm shadow-sm'
            : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm shadow-sm'
        }`}>
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-emerald-500 dark:bg-emerald-400 rounded-sm ml-1 animate-pulse" />
          )}
        </div>

        {/* Timestamp + actions */}
        <div className={`flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && (
            <>
              <button onClick={() => onCopy(message.content)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition">
                <Copy className="w-3 h-3" />
              </button>
              <button onClick={() => onFeedback(message.id, 'up')} className="text-zinc-400 hover:text-emerald-600 transition">
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button onClick={() => onFeedback(message.id, 'down')} className="text-zinc-400 hover:text-rose-600 transition">
                <ThumbsDown className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isStreaming === nextProps.message.isStreaming &&
    prevProps.message.state === nextProps.message.state
  );
});

// ─── Suggested Prompts ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: Leaf, text: "My tomato leaves have yellow spots. What disease is this?", label: "Disease ID" },
  { icon: CloudRain, text: "When should I irrigate based on upcoming weather?", label: "Weather Plan" },
  { icon: BarChart3, text: "What is the current market price for onions in Nashik?", label: "Market Rates" },
  { icon: ShieldCheck, text: "What government subsidies are available for drip irrigation?", label: "Gov Schemes" },
  { icon: Droplet, text: "Suggest a fertilizer schedule for my wheat crop.", label: "Fertilizer Plan" },
  { icon: BookOpen, text: "What crops should I grow this season based on soil NPK and pH?", label: "Crop Advice" },
];

// ─── Main Chat Component ───────────────────────────────────────────────────────

export const Chat = () => {
  const { userId, currentSessionId, createNewSession, profile } = useAppState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentState, setCurrentState] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(currentSessionId);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<boolean>(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Ensure we have a session
  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;
    const newId = await createNewSession();
    setSessionId(newId);
    return newId;
  }, [sessionId, createNewSession]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || isStreaming) return;

    setInputText('');
    abortRef.current = false;

    // Add user message
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Placeholder assistant message
    const assistantId = `a_${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      state: 'Security',
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);
    setCurrentState('Security');

    try {
      const sid = await ensureSession();

      let accumulated = '';

      await api.runSseChatStream(
        userId,
        sid,
        text,
        (state) => {
          if (abortRef.current) return;
          setCurrentState(state);
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, state } : m)
          );
        },
        (chunk) => {
          if (abortRef.current) return;
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: accumulated, isStreaming: true } : m)
          );
        },
        (err) => {
          console.error('Stream error:', err);
          const isRateLimited = err.message === 'RATE_LIMITED' || err.message.includes('429');
          const errorContent = accumulated || (
            isRateLimited
              ? '⏳ The AI service is busy right now. Please try again in a few seconds.'
              : "I'm sorry, I couldn't connect to the AI backend. Please ensure the KrishiMitra server is running on port 8000."
          );
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: errorContent, isStreaming: false, state: undefined }
                : m
            )
          );
        }
      );

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, isStreaming: false, state: undefined, content: accumulated || m.content }
            : m
        )
      );
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setIsStreaming(false);
      setCurrentState('');
    }
  }, [inputText, isStreaming, userId, ensureSession]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    const msg = messages.find((m) => m.id === id);
    if (!msg || !sessionId) return;
    api.submitFeedback({
      score: type === 'up' ? 5 : 1,
      user_id: userId,
      session_id: sessionId,
      text: `User rated message: "${msg.content.substring(0, 100)}"`,
    }).catch(console.error);
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem-2rem)]">

      {/* ── Chat Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-800 dark:text-zinc-100">KrishiMitra AI</h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Multi-Agent Agricultural Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-blue-900">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {(STATE_UI[currentState]?.label) || 'Processing…'}
            </div>
          )}
          {!isEmpty && (
            <button
              onClick={clearChat}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
            >
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* ── Messages Area ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-1">
        {isEmpty ? (
          /* Welcome / Suggestions screen */
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 min-h-[340px]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-xl shadow-emerald-600/20 mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-2">
              How can I help, Farmer? 🌾
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mb-8 leading-relaxed">
              {profile
                ? `I have your farm profile for ${profile.location} loaded. Ask about crops: ${profile.crops.join(', ') || 'any crop'}, soil health, weather, diseases, or market rates.`
                : 'Ask about soil health, weather, crop diseases, irrigation, market rates, or government schemes.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.text)}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all duration-200 text-left group hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{s.label}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug mt-0.5">{s.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Message thread */
          <div className="space-y-6 py-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onCopy={handleCopy}
                  onFeedback={handleFeedback}
                />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Bar ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mt-4">
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2 text-center text-xs text-emerald-600 dark:text-emerald-400"
          >
            ✓ Copied to clipboard
          </motion.div>
        )}

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-lg overflow-hidden focus-within:border-emerald-400 dark:focus-within:border-emerald-700 transition-colors">
          <div className="flex items-end gap-3 p-3">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={isStreaming ? 'AI agents are working...' : 'Ask about your farm, soil, crops, weather, diseases or market prices...'}
              rows={1}
              className="flex-1 resize-none bg-transparent border-0 outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm py-2 focus:ring-0 min-h-[40px] max-h-[200px]"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isStreaming}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-600/20"
            >
              {isStreaming ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 px-4 py-2 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Sprout className="w-3 h-3 text-emerald-500" />
              KrishiMitra AI · Google ADK · Gemini 2.5 Flash
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> to send · Shift+Enter for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
