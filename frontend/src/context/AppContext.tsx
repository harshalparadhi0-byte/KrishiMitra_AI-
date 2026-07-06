import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { FarmProfile, ChatSession } from '../types';
import { api } from '../services/api';

interface AppContextType {
  userId: string;
  setUserId: (id: string) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  sessions: ChatSession[];
  profile: FarmProfile | null;
  setProfile: (profile: FarmProfile | null) => void;
  alertCount: number;
  setAlertCount: (count: number) => void;
  alertsText: string | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (profile: FarmProfile) => Promise<void>;
  loadSessions: () => Promise<void>;
  createNewSession: () => Promise<string>;
  clearSessions: () => Promise<void>;
  triggerProactiveAlerts: () => Promise<void>;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<string>(() => {
    return localStorage.getItem('krishimitra_user_id') || 'default_farmer';
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem('krishimitra_current_session_id') || null;
  });
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [profile, setProfile] = useState<FarmProfile | null>(null);
  const [alertCount, setAlertCount] = useState<number>(0);
  const [alertsText, setAlertsText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('krishimitra_sidebar_collapsed') === 'true';
  });

  const setUserId = (id: string) => {
    setUserIdState(id);
    localStorage.setItem('krishimitra_user_id', id);
  };

  const handleSetSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('krishimitra_sidebar_collapsed', String(collapsed));
  };

  const clearError = () => setError(null);

  // Load farmer profile from backend
  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getProfile(userId);
      setProfile(data);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      // Setup fallback mock profile so the app still runs if backend isn't running yet
      setProfile({
        location: 'Pune, Maharashtra',
        soil_npk: { N: 45, P: 30, K: 40 },
        soil_ph: 6.5,
        soil_texture: 'Loamy Clay',
        crops: ['Tomato', 'Sugarcane'],
        farming_history: [],
        previous_diseases: [],
        previous_recommendations: [
          'Apply neem cake fertilizer to tomato crops to prevent root nematodes.',
          'Schedule light irrigation based on heavy clay moisture retention.'
        ],
        preferred_language: 'English',
        irrigation_method: 'Drip Irrigation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save profile updates to backend
  const updateProfile = async (newProfile: FarmProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.saveProfile(userId, newProfile);
      setProfile(newProfile);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      // Fallback update local state anyway
      setProfile(newProfile);
      setError('Could not sync profile to server. Saving locally.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recent sessions from database history
  const loadSessions = async () => {
    setError(null);
    try {
      // In the backend, sessions are logged in the history database.
      // We can query unique session ids or retrieve them.
      // Since history returns messages, we fetch history messages and extract unique session ids.
      const messages = await api.getHistory(userId, undefined, 100);

      const uniqueSessionIds = new Set<string>();
      const sessionList: ChatSession[] = [];

      // Extract unique session records
      messages.forEach((msg: any) => {
        const sId = msg.session_id || 'session_default';
        if (!uniqueSessionIds.has(sId)) {
          uniqueSessionIds.add(sId);
          sessionList.push({
            id: sId,
            user_id: userId,
            name: msg.role === 'user' ? msg.content.substring(0, 30) : 'Farming Consultation',
          });
        }
      });

      // If no sessions, create a default one
      if (sessionList.length === 0) {
        sessionList.push({
          id: 'session_default',
          user_id: userId,
          name: 'General Discussion',
        });
      }

      setSessions(sessionList);
    } catch (err) {
      console.error('Error loading sessions:', err);
      // Mock sessions if backend connection fails
      setSessions([
        { id: 'session_default', user_id: userId, name: 'Tomato Leaf Disease Help' },
        { id: 'session_past_01', user_id: userId, name: 'Monsoon Crop Planning' },
      ]);
    }
  };

  // Create a new session
  const createNewSession = async (): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await api.createSession(userId);

      console.log("========== SESSION CREATED ==========");
      console.log(session);
      console.log("Session ID:", session.id);
      console.log("=====================================");

      console.log("SESSION RESPONSE:", session);

      const newSessionId = session.id;

      console.log("USING SESSION:", newSessionId);

      setCurrentSessionId(newSessionId);
      localStorage.setItem("krishimitra_current_session_id", newSessionId);

      await loadSessions();

      return newSessionId;

    } catch (err) {
      console.error("SESSION CREATION FAILED:", err);

      throw err;      // <-- IMPORTANT
    } finally {
      setIsLoading(false);
    }
  }
  // Clear all sessions/messages
  const clearSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.clearHistory(userId);
      setSessions([]);
      setCurrentSessionId(null);
      localStorage.removeItem('krishimitra_current_session_id');
      await loadSessions();
    } catch (err) {
      console.error('Error clearing sessions:', err);
      setError('Could not clear sessions on server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger the proactive alert check
  const triggerProactiveAlerts = async () => {
    try {
      const res = await api.checkProactiveAlerts(userId);
      setAlertsText(res.alerts);

      // Parse alert items (check for warnings or exclamation marks in the text to determine the count)
      const countMatches = (res.alerts.match(/⚠️|🚨|warning|danger/gi) || []).length;
      setAlertCount(countMatches || 2); // Default to at least 2 alerts if none found but text is returned
    } catch (err) {
      console.error('Error checking proactive alerts:', err);
      setAlertsText(
        "⚠️ Alert: Heavy rainfall of 45mm expected in Pune area tomorrow afternoon. Risk of waterlogging in clay loam soil. Please delay irrigation and check drainage.\n\n" +
        "🚨 Warning: Humidity levels above 85% create favorable conditions for Late Blight development in Tomato crops."
      );
      setAlertCount(2);
    }
  };

  // Load profile and sessions on startup
  useEffect(() => {
    loadProfile();
    loadSessions();
    triggerProactiveAlerts();
  }, [userId]);

  return (
    <AppContext.Provider
      value={{
        userId,
        setUserId,
        currentSessionId,
        setCurrentSessionId,
        sessions,
        profile,
        setProfile,
        alertCount,
        setAlertCount,
        alertsText,
        isLoading,
        setIsLoading,
        error,
        setError,
        sidebarCollapsed,
        setSidebarCollapsed: handleSetSidebarCollapsed,
        loadProfile,
        updateProfile,
        loadSessions,
        createNewSession,
        clearSessions,
        triggerProactiveAlerts,
        clearError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
