import type { FarmProfile, ChatMessage, ChatSession, ProactiveAlertsResponse, FeedbackInput } from '../types';

// Use empty string so requests are relative URLs → routed through the Vite dev proxy.
// In production, set VITE_API_BASE to the deployed backend URL (e.g. https://api.example.com).
const API_BASE = import.meta.env.VITE_API_BASE || '';

export const api = {
  /**
   * Retrieve persistent farm profile for a user
   */
  async getProfile(userId: string): Promise<FarmProfile> {
    const res = await fetch(`${API_BASE}/api/profile/${userId}`);
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  /**
   * Save or update farm profile
   */
  async saveProfile(userId: string, profile: FarmProfile): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/profile/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
  },

  /**
   * Fetch conversation history for a user, optionally filtered by session
   */
  async getHistory(userId: string, sessionId?: string, limit = 20): Promise<ChatMessage[]> {
    const baseUrl = API_BASE.startsWith('http') ? API_BASE : window.location.origin + API_BASE;
    const url = new URL(`${baseUrl}/api/history/${userId}`);
    if (sessionId) url.searchParams.append('session_id', sessionId);
    url.searchParams.append('limit', String(limit));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to load history');
    const rawHistory = await res.json();
    
    // Normalize response from DB: DB schema logs history as a flat list
    return rawHistory.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || msg.created_at,
    }));
  },

  /**
   * Clear all conversation history for a user
   */
  async clearHistory(userId: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/history/${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear history');
    return res.json();
  },

  /**
   * Trigger the proactive notification agent for a user's farm
   */
  async checkProactiveAlerts(userId: string): Promise<ProactiveAlertsResponse> {
    const res = await fetch(`${API_BASE}/api/proactive_alerts/${userId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to check proactive alerts');
    return res.json();
  },

  /**
   * Log user feedback
   */
  async submitFeedback(feedback: FeedbackInput): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },

  /**
   * Create a new session for the user
   */
  async createSession(userId: string): Promise<ChatSession> {
    const res = await fetch(`${API_BASE}/apps/app/users/${userId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: { preferred_language: 'English', visit_count: 1 }
      }),
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  /**
   * SSE Stream Chat Endpoint Wrapper
   *
   * The ADK /run_sse endpoint emits one SSE event per pipeline node output:
   *   - conversation_intelligence_agent  → JSON intent object   (skip)
   *   - security_checkpoint              → security dict         (skip)
   *   - task_planner_agent               → JSON agent list       (skip)
   *   - soil_health_agent, weather_*_agent, etc. → raw reports  (skip)
   *   - decision_synthesizer_agent       → JSON synthesis        (skip)
   *   - executive_orchestrator           → [STATE:…] + final text (SHOW)
   *
   * We filter by event.author so that only the orchestrator's output reaches
   * the chat bubble.  [STATE: …] lines are converted to progress indicators;
   * all other orchestrator text is streamed to the message content.
   */
  async runSseChatStream(
    userId: string,
    sessionId: string,
    queryText: string,
    onStateChange: (state: string) => void,
    onContent: (chunk: string) => void,
    onError: (err: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/run_sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: 'app',
          userId: userId,
          sessionId: sessionId,
          newMessage: {
            role: 'user',
            parts: [{ text: queryText }]
          },
          streaming: true,
        }),
      });

      // Handle HTTP-level errors before reading the stream body
      if (!response.ok) {
        if (response.status === 429) {
          onError(new Error('RATE_LIMITED'));
        } else {
          throw new Error(`Server returned status ${response.status}`);
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported by browser.');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const eventData = JSON.parse(trimmed.slice(6));

            // ── In-stream error events (e.g. ResourceExhausted / quota) ──
            if (eventData.error) {
              const errMsg = String(eventData.error);
              const isQuota =
                errMsg.includes('429') ||
                /quota|exhausted|resource|rate.?limit/i.test(errMsg);
              onError(new Error(isQuota ? 'RATE_LIMITED' : errMsg));
              return;
            }

            // ── Author filter ─────────────────────────────────────────────
            // Render content from the top-level workflow node and the
            // executive orchestrator. ADK emits all user-facing output
            // (greeting fast-path, [STATE:…] markers, final synthesized
            // response) with author="krishimitra_workflow". The string
            // "executive_orchestrator" and bare "app" are also valid in
            // some ADK versions / configurations.
            // All other internal pipeline nodes (CI agent, security,
            // planner, specialist agents, decision synthesizer) are still
            // filtered out so the user never sees raw intermediate output.
            const author: string | undefined = eventData.author;
            const VISIBLE_AUTHORS = new Set([
              'krishimitra_workflow',
              'executive_orchestrator',
              'app',
            ]);
            if (author && !VISIBLE_AUTHORS.has(author)) continue;

            // ── Content extraction ────────────────────────────────────────
            const content = eventData.content;
            if (!content?.parts) continue;

            for (const part of content.parts) {
              if (typeof part.text !== 'string') continue;
              const text: string = part.text;

              // [STATE: X] markers → progress indicator, not chat text
              const stateMatch = text.match(/^\[STATE:\s*([^\]]+)\]/);
              if (stateMatch) {
                onStateChange(stateMatch[1].trim());
              } else if (text.trim()) {
                onContent(text);
              }
            }
          } catch {
            // Silently discard malformed / non-JSON SSE lines
          }
        }
      }
    } catch (err: any) {
      onError(err);
    }
  }

};
