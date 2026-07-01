/**
 * =============================================================================
 * MeetScribe - Popup Entry Point
 * =============================================================================
 *
 * This is the React application entry point for the extension popup.
 * The popup appears when the user clicks the MeetScribe icon in the toolbar.
 *
 * It renders the main App component into the #root div in popup.html.
 * =============================================================================
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/popup.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
