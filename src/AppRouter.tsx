/**
 * Main Router Component for Paradex
 * Handles routing between main app, legal pages, and guardian portal
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import { GuardianPortal } from "./components/GuardianPortal";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfService } from "./components/TermsOfService";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main App Flow */}
        <Route path="/" element={<App />} />
        
        {/* Guardian Portal - Standalone page accessible via tokenized link */}
        <Route path="/guardian" element={<GuardianPortal />} />
        
        {/* Legal Pages - Required for App Store compliance */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
