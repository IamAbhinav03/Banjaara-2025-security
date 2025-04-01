import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EntryExitPortal from "./components/portal/EntryExitPortal";
import PublicRegistration from "./components/PublicRegistration";

/**
 * Main App component that handles routing and layout
 *
 * This component sets up the application's routing structure:
 * - /register - Public registration page
 * - / - Main entry/exit portal
 */
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<PublicRegistration />} />
        <Route path="/" element={<EntryExitPortal />} />
      </Routes>
    </Router>
  );
};

export default App;
