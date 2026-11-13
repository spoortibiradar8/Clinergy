import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./components/layout/MainLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SplashScreen } from "./components/SplashScreen";
import HomePage from "./pages/HomePage";


import ZonesPage from "./pages/ZonesPage";
import ZoneDetailPage from "./pages/ZoneDetailPage";
import ReportsPage from "./pages/ReportsPage";
import AIInsightsPage from "./pages/AIInsightsPage";
import AlertsPage from "./pages/AlertsPage";
import SettingsPage from "./pages/SettingsPage";
import SearchPage from "./pages/SearchPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import LiveMonitoringPage from "./pages/LiveMonitoringPage";
import MaintenancePage from "./pages/MaintenancePage";
// Backend simulator used instead of local dataSimulator
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useAlerts } from "./hooks/useRealtimeData";
import AccessibilityToolbar from "./components/AccessibilityToolbar";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
function GlobalNavigator() {
  const navigate = useNavigate();
  useEffect(() => {
    (window as any).__clinergy_navigate = navigate;
  }, [navigate]);
  return null;
}

function App() {
  const { alerts } = useAlerts(1);
  const latestAlert = alerts?.[0];
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        document.dispatchEvent(new CustomEvent('toggleA11yToolbar'));
      }
    };
    window.addEventListener('keydown', handler);
    
    // Dark mode is already applied in main.tsx — keep in sync on settings change
    const syncDark = () => {
      const isDark = localStorage.getItem("clinergy_dark_mode");
      if (isDark === "true") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    window.addEventListener("clinergy-settings-update", syncDark);
    window.addEventListener("storage", syncDark);

    // Python backend simulator should be running via start.bat
    const setup = async (): Promise<void> => {
      // no-op, relying on Python backend
    };
    setup();

    return () => {
      window.removeEventListener("clinergy-settings-update", syncDark);
      window.removeEventListener("storage", syncDark);
      window.removeEventListener('keydown', handler);
    };
  }, []);

  const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true';

  return (
    <AuthProvider>
      <LanguageProvider>
        <GlobalNavigator />
      <Routes>
          <Route path="/login" element={requireAuth ? <Login /> : <Navigate to="/" replace />} />
          
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<ErrorBoundary pageName="Home"><HomePage /></ErrorBoundary>} />
            <Route path="/live" element={<ErrorBoundary pageName="Live Monitor"><LiveMonitoringPage /></ErrorBoundary>} />
            <Route path="/maintenance" element={<ErrorBoundary pageName="Maintenance"><MaintenancePage /></ErrorBoundary>} />
            <Route path="/search" element={<ErrorBoundary pageName="Search"><SearchPage /></ErrorBoundary>} />
            <Route path="/admin/users" element={<ProtectedRoute requireRole="admin"><ErrorBoundary pageName="Admin Portal"><UserManagementPage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/zones" element={<ErrorBoundary pageName="Zones"><ZonesPage /></ErrorBoundary>} />
            <Route path="/zones/:zoneName" element={<ErrorBoundary pageName="Zone Detail"><ZoneDetailPage /></ErrorBoundary>} />
            <Route path="/reports" element={<ErrorBoundary pageName="Reports"><ReportsPage /></ErrorBoundary>} />
            <Route path="/ai-insights" element={<ErrorBoundary pageName="AI Insights"><AIInsightsPage /></ErrorBoundary>} />
            <Route path="/alerts" element={<ErrorBoundary pageName="Alerts"><AlertsPage /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary pageName="Settings"><SettingsPage /></ErrorBoundary>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
        <AccessibilityToolbar />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
