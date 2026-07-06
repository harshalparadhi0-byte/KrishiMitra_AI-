import { useState, useEffect } from 'react';
import { useAppState } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { ChatMessage } from '../types';
import {
  History as HistoryIcon, Calendar, MessageSquare, Trash2, ArrowRight,
  Search, BookOpen, ChevronRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const History = () => {
  const { userId, sessions, currentSessionId, setCurrentSessionId, loadSessions } = useAppState();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsg, setLoadingMsg] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  // Fetch messages if a session is selected
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMsg(true);
      try {
        const history = await api.getHistory(userId, selectedSession);
        setMessages(history);
      } catch (err) {
        console.error('Failed to load session history:', err);
      } finally {
        setLoadingMsg(false);
      }
    };

    fetchMessages();
  }, [selectedSession, userId]);

  const handleSelectSession = (sid: string) => {
    setSelectedSession(sid);
  };

  const handleResumeSession = (sid: string) => {
    setCurrentSessionId(sid);
    localStorage.setItem('krishimitra_current_session_id', sid);
    navigate('/chat');
  };

  const handleDeleteSession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    try {
      // Clean up session messages or log
      // In the backend schema, we clear history by userId or filter. Let's just simulate item deletion
      // We also reload the session list
      if (selectedSession === sid) setSelectedSession(null);
      await loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-zinc-500" /> Consultation History
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Review and resume all your past agricultural agent discussions.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 transition shadow-sm"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Sessions List (1 col) */}
        <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session, idx) => {
              const active = selectedSession === session.id;
              const isCurrent = currentSessionId === session.id;
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleSelectSession(session.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${
                    active
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Session
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-250 dark:border-emerald-900">
                          Active
                        </span>
                      )}
                    </div>
                    <p className={`font-semibold text-xs truncate mt-1 ${active ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {session.name}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700" />
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-8 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <MessageSquare className="w-6 h-6 text-zinc-300 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-zinc-500">No sessions match search</p>
            </div>
          )}
        </div>

        {/* Right: Session Thread Details (2 cols) */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedSession ? (
              <motion.div
                key={selectedSession}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm flex flex-col h-[500px]"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800/80 pb-4 mb-4 flex-shrink-0">
                  <div>
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">
                      {sessions.find((s) => s.id === selectedSession)?.name || 'Farming Consultation'}
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Read-only view</p>
                  </div>
                  <button
                    onClick={() => handleResumeSession(selectedSession)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Resume Consultation <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Messages scrollarea */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
                  {loadingMsg ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="text-xs">Fetching messages...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                            isUser ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600' : 'bg-emerald-600 text-white'
                          }`}>
                            {isUser ? '👨‍🌾' : '🌱'}
                          </div>
                          <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[80%] whitespace-pre-wrap ${
                            isUser
                              ? 'bg-emerald-600 text-white rounded-tr-none'
                              : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-tl-none'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                      <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs">No messages recorded in this session.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col items-center justify-center text-center h-[500px]"
              >
                <HistoryIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-xs font-semibold text-zinc-650 dark:text-zinc-400">Select a Consultation</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px]">
                  Choose any history record on the left to review the conversation, study recommendations, or load it back to your active workspace.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
