/**
 * Application entry point.
 * Sets up React Router with routes for URL-based navigation.
 *
 * Routes:
 *   /                              → Projects grid
 *   /projects/:id                  → Meetings list for a project
 *   /projects/:id/:meetingId       → Meetings list with drawer open
 *   /settings                      → Integration settings page
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { App } from './App';
import { SettingsPage } from './components/SettingsPage';
import './index.css';

function SettingsRoute() {
  const navigate = useNavigate();
  return <SettingsPage onBack={() => navigate('/')} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/projects/:projectId" element={<App />} />
        <Route path="/projects/:projectId/:meetingId" element={<App />} />
        <Route path="/settings" element={<SettingsRoute />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
