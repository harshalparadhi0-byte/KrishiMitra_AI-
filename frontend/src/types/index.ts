export interface SoilNPK {
  N: number;
  P: number;
  K: number;
}

export interface FarmProfile {
  location: string;
  soil_npk: SoilNPK;
  soil_ph: number;
  soil_texture: string;
  crops: string[];
  farming_history: Record<string, any>[];
  previous_diseases: Record<string, any>[];
  previous_recommendations: string[];
  preferred_language: string;
  irrigation_method: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  name?: string;
}

export interface ProactiveAlertsResponse {
  user_id: string;
  alerts: string;
}

export interface FeedbackInput {
  score: number;
  user_id: string;
  session_id: string;
  text: string;
}
