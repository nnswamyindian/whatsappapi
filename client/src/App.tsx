import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { CampaignsPage } from './pages/campaigns/CampaignsPage';
import { TemplatesPage } from './pages/templates/TemplatesPage';
import { ContactsPage } from './pages/contacts/ContactsPage';
import { AudiencesPage } from './pages/audiences/AudiencesPage';
import { InboxPage } from './pages/inbox/InboxPage';
import { AutomationsPage } from './pages/automations/AutomationsPage';
import { IntegrationsPage } from './pages/integrations/IntegrationsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { BillingPage } from './pages/billing/BillingPage';
import { TeamPage } from './pages/team/TeamPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AdminPage } from './pages/admin/AdminPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="campaigns/new" element={<CampaignsPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="audiences" element={<AudiencesPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="automations" element={<AutomationsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
