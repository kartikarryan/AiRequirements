import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { App } from './App';
import { SettingsPage } from './components/SettingsPage';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function SettingsRoute() {
  const navigate = useNavigate();
  return <SettingsPage onBack={() => navigate('/')} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="/projects/:projectId/:meetingId" element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsRoute /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
