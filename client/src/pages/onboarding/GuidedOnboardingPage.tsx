import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Phone,
  FileCode2,
  Users,
  Send,
  Sparkles,
  Lock,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const GuidedOnboardingPage: React.FC = () => {
  const { activeOrg } = useAuth();
  const navigate = useNavigate();

  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingKey, setVerifyingKey] = useState<string | null>(null);

  const fetchOnboarding = async () => {
    try {
      const data = await api.get('/onboarding');
      setOnboardingData(data);
    } catch (err) {
      console.error('Failed to load onboarding steps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const handleVerifyStep = async (stepKey: string) => {
    setVerifyingKey(stepKey);
    try {
      await api.post('/onboarding/verify-step', { stepKey });
      await fetchOnboarding();
      if (stepKey === 'complete_onboarding') {
        navigate('/');
      }
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifyingKey(null);
    }
  };

  const stepActions: Record<string, { label: string; link?: string; onClick?: () => void }> = {
    business_profile: { label: 'Edit Profile in Settings', link: '/settings' },
    account_review: { label: 'Check Review Status', link: '/application-status' },
    whatsapp_embedded_signup: { label: 'Connect Meta WhatsApp', link: '/settings' },
    meta_business_verification: { label: 'Meta Business Manager', link: 'https://business.facebook.com' },
    confirm_phone_number: { label: 'View Connection Status', link: '/settings' },
    sync_templates: { label: 'Open Template Studio', link: '/templates' },
    import_contacts: { label: 'Import Contacts Wizard', link: '/contacts' },
    configure_team: { label: 'Invite Team Members', link: '/team' },
    configure_roles: { label: 'Manage RBAC Permissions', link: '/team' },
    create_test_campaign: { label: 'Create Test Campaign', link: '/campaigns/new' },
    send_test_message: { label: 'Open Inbox Simulator', link: '/inbox' },
    complete_onboarding: { label: 'Finish & Launch Workspace' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const steps = onboardingData?.steps || [];
  const percentage = onboardingData?.percentage || 0;
  const completedCount = onboardingData?.completedCount || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full text-brand-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Workspace Setup Checklist</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Guided Customer Onboarding
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete these steps to unlock live campaign broadcasts and official WhatsApp messaging for <strong>{activeOrg?.name}</strong>.
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-brand-700">{percentage}%</div>
            <div className="text-xs text-slate-500 font-semibold">{completedCount} of 12 steps verified</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className="bg-brand-600 h-full transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step: any, idx: number) => {
          const action = stepActions[step.key];
          const isVerifying = verifyingKey === step.key;

          return (
            <div
              key={step.key}
              className={`p-5 rounded-2xl border transition-all ${
                step.isCompleted
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-white border-brand-300 ring-2 ring-brand-500/10 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    {step.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400">Step {idx + 1}</span>
                      <h3 className={`text-sm font-bold ${step.isCompleted ? 'text-slate-800' : 'text-slate-900'}`}>
                        {step.title}
                      </h3>
                      {step.isCompleted && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!step.isCompleted && action?.link && (
                    <Link
                      to={action.link}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>{action.label}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </Link>
                  )}

                  {!step.isCompleted && (
                    <button
                      onClick={() => handleVerifyStep(step.key)}
                      disabled={isVerifying}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50"
                    >
                      {isVerifying ? 'Verifying...' : 'Mark Completed'}
                    </button>
                  )}

                  {step.isCompleted && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      ✓ Done
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Banner */}
      {percentage === 100 && (
        <div className="bg-gradient-to-tr from-brand-900 to-brand-700 rounded-3xl p-8 text-white text-center space-y-4 shadow-xl">
          <h2 className="text-2xl font-black">All Onboarding Steps Verified! 🎉</h2>
          <p className="text-xs text-brand-100 max-w-md mx-auto">
            Your workspace is now ready for production broadcasts, shared inbox customer support, and visual chatbot automation.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 bg-white text-brand-900 hover:bg-brand-50 font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
          >
            <span>Go to Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

