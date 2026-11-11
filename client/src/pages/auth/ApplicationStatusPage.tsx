import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  LogOut,
  Send,
  Building2,
  Mail,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../services/api';

export const ApplicationStatusPage: React.FC = () => {
  const { user, activeOrg, logout } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resubmitText, setResubmitText] = useState('');
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await api.get('/auth/application-status');
      setApplication(data);
    } catch (err) {
      console.error('Failed to load application status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitText.trim()) return;

    setResubmitting(true);
    try {
      await api.post('/auth/application-resubmit', { updatedInfo: resubmitText });
      setResubmitSuccess(true);
      setResubmitText('');
      await fetchStatus();
    } catch (err: any) {
      alert(err.message || 'Failed to submit additional information.');
    } finally {
      setResubmitting(false);
    }
  };

  const status = application?.approval_status || activeOrg?.approval_status || 'PENDING_APPROVAL';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-900 to-brand-600 flex items-center justify-center text-white mx-auto shadow-md">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Application Status
        </h1>
        <p className="text-xs text-slate-500">
          GreenWave Compliance & Business Onboarding Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {application?.name || activeOrg?.name || 'Your Business'}
              </h2>
              <p className="text-xs text-slate-500">
                Account Owner: {user?.fullName} ({user?.email})
              </p>
            </div>

            {/* Status Pill */}
            <div>
              {status === 'PENDING_APPROVAL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Admin Review
                </span>
              )}
              {status === 'ACTION_REQUIRED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5 text-blue-600" /> Additional Info Needed
                </span>
              )}
              {status === 'APPROVED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
                </span>
              )}
              {status === 'REJECTED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-full">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Application Rejected
                </span>
              )}
              {status === 'SUSPENDED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-full">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Workspace Suspended
                </span>
              )}
            </div>
          </div>

          {/* Body Content based on Status */}
          {status === 'PENDING_APPROVAL' && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" /> Application Under Review
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Thank you for registering with GreenWave. Your application is currently being evaluated by our platform administration team to ensure carrier messaging compliance. You will receive an automated email as soon as your workspace is approved.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2 text-slate-600">
                <div className="font-bold text-slate-800">Submitted Profile Summary:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-400">Category:</span> {application?.business_category || 'Retail'}</div>
                  <div><span className="text-slate-400">Country:</span> {application?.country || 'IN'}</div>
                  <div><span className="text-slate-400">WhatsApp Phone:</span> {application?.phone_e164 || 'Configured'}</div>
                  <div><span className="text-slate-400">Submitted On:</span> {new Date(application?.created_at || Date.now()).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          )}

          {status === 'ACTION_REQUIRED' && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600" /> Additional Details Requested
                </h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Our review team requested additional information before approving your workspace:
                </p>
                <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs text-slate-800 font-medium">
                  {application?.info_requested_details || 'Please provide verification of your official business registration certificate and website domain ownership.'}
                </div>
              </div>

              {resubmitSuccess ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold text-center">
                  ✅ Your updated details have been submitted to the review queue.
                </div>
              ) : (
                <form onSubmit={handleResubmit} className="space-y-3 text-xs">
                  <label className="block font-bold text-slate-700">Submit Requested Details *</label>
                  <textarea
                    rows={3}
                    required
                    value={resubmitText}
                    onChange={(e) => setResubmitText(e.target.value)}
                    placeholder="Enter additional business details, GSTIN/EIN registration, or website verification..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={resubmitting}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {resubmitting ? 'Submitting...' : 'Submit to Review Queue'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {status === 'APPROVED' && (
            <div className="space-y-4 py-2 text-center">
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-900">Your Workspace is Approved! 🎉</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Congratulations! Your application has been verified. You can now launch the guided onboarding workspace to connect your WhatsApp number using Meta Embedded Signup.
                </p>
                <div className="pt-2">
                  <Link
                    to="/onboarding"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl text-xs shadow-md transition-all"
                  >
                    <span>Launch Guided Onboarding</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {status === 'REJECTED' && (
            <div className="space-y-4 py-2">
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" /> Application Was Not Approved
                </h3>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Reason provided by compliance reviewer:
                </p>
                <div className="bg-white p-3 rounded-xl border border-rose-200 text-xs text-slate-800 font-medium">
                  {application?.rejection_reason || 'Does not meet carrier business messaging guidelines.'}
                </div>
                <p className="text-[11px] text-rose-700 pt-1">
                  If you believe this decision was made in error or wish to appeal, please contact support@greenwave.io.
                </p>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={fetchStatus}
              className="font-bold text-brand-700 hover:underline"
            >
              ↻ Refresh Status
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 font-bold text-rose-600 hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

