import React from "react";
import EntryExitPortal from "./components/portal/EntryExitPortal";

/**
 * Main App component that handles routing and layout
 *
 * This component sets up the application's routing structure:
 * - /register - Public registration page
 * - / - Main entry/exit portal
 */
const App: React.FC = () => {
  return (
    // <Router>
    //   <Routes>
    //     <Route path="/register" element={<PublicRegistration />} />
    //     <Route path="/" element={<EntryExitPortal />} />
    //   </Routes>
    // </Router>
    <EntryExitPortal />
  );
};

export default App;
