import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { HomePage, AnalyzePage, TradePage, PositionsPage, SettingsPage } from './pages';

// ============================================================================
// APEX SNIPER - Mobile-First Dashboard
// Enterprise-grade trading interface for crypto wallet integration
// ============================================================================

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-950 text-white">
        {/* Page Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/analyze/:tokenAddress" element={<AnalyzePage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/positions/:positionId" element={<PositionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        
        {/* Bottom Navigation Bar */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
