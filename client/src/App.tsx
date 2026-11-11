import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Public Marketing Pages
import { LandingPage } from './pages/public/LandingPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { SolutionsPage } from './pages/public/SolutionsPage';
import { PricingPage } from './pages/public/PricingPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { FaqPage } from './pages/public/FaqPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/public/TermsOfServicePage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ApplicationStatusPage } from './pages/auth/ApplicationStatusPage';

// Authenticated Application Pages
import { OverviewPage } from './pages/OverviewPage';
import { GuidedOnboardingPage } from './pages/onboarding/GuidedOnboardingPage';
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
import { ChatbotStudioPage } from './pages/chatbots/ChatbotStudioPage';
import { CrmPipelinePage } from './pages/crm/CrmPipelinePage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading, activeOrg } = useAuth();

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

  // If customer is pending approval, redirect to status page
  if (
    activeOrg?.approval_status &&
    ['PENDING_APPROVAL', 'REJECTED', 'ACTION_REQUIRED'].includes(activeOrg.approval_status)
  ) {
    return <Navigate to="/application-status" replace />;
  }

  return <>{children}</>;
};

// Root Router decider
const RootRouter: React.FC = () => {
  const { token, isLoading, activeOrg } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <PublicLayout>
        <LandingPage />
      </PublicLayout>
    );
  }

  if (
    activeOrg?.approval_status &&
    ['PENDING_APPROVAL', 'REJECTED', 'ACTION_REQUIRED'].includes(activeOrg.approval_status)
  ) {
    return <Navigate to="/application-status" replace />;
  }

  return (
    <AppLayout>
      <OverviewPage />
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root Route: Shows Landing for guests, Overview for approved users */}
          <Route path="/" element={<RootRouter />} />

          {/* Public Marketing Routes under PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="features" element={<FeaturesPage />} />
            <Route path="solutions" element={<SolutionsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="terms-of-service" element={<TermsOfServicePage />} />
          </Route>

          {/* Public Auth & Application Status Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/application-status" element={<ApplicationStatusPage />} />

          {/* Authenticated Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<OverviewPage />} />
            <Route path="/onboarding" element={<GuidedOnboardingPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/new" element={<CampaignsPage />} />
            <Route path="/chatbots" element={<ChatbotStudioPage />} />
            <Route path="/crm" element={<CrmPipelinePage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/audiences" element={<AudiencesPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
