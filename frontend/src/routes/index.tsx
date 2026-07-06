import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { Chat } from './Chat';
import { AgentTimeline } from './AgentTimeline';
import { Profile } from './Profile';
import { Settings } from './Settings';
import { WeatherDashboard } from './WeatherDashboard';
import { MarketIntelligence } from './MarketIntelligence';
import { DiseaseDetection } from './DiseaseDetection';
import { GovernmentSchemes } from './GovernmentSchemes';
import { NotificationsCenter } from './NotificationsCenter';
import { History } from './History';
import { Analytics } from './Analytics';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/agents" element={<AgentTimeline />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/weather" element={<WeatherDashboard />} />
      <Route path="/market" element={<MarketIntelligence />} />
      <Route path="/disease" element={<DiseaseDetection />} />
      <Route path="/schemes" element={<GovernmentSchemes />} />
      <Route path="/notifications" element={<NotificationsCenter />} />
      <Route path="/history" element={<History />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
