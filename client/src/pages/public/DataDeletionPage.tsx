import React, { useState } from 'react';
import { api } from '../../services/api';
import { ShieldCheck, Search, Trash2, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';

export const DataDeletionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submit' | 'lookup' | 'meta_instructions'>('submit');

  // Submit Request State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);

  // Status Lookup State
  const [lookupCode, setLookupCode] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await api.post('/meta/data-deletion/request', {
        name,
        email,
        phone,
        reason,
      });
      setSubmitResult(res);
      setName('');
      setEmail('');
      setPhone('');
      setReason('');
    } catch (err: any) {
      setSubmitResult({
        error: true,
        message: err.message || 'Failed to submit data deletion request. Please contact hello@digi8solutions.com',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookupStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCode.trim()) return;

    setIsLookingUp(true);
    setLookupResult(null);

    try {
      const res = await api.get(`/meta/data-deletion/status/${encodeURIComponent(lookupCode.trim())}`);
      setLookupResult(res);
    } catch (err: any) {
      setLookupResult({
        error: true,
        message: err.message || 'Confirmation code not found or request lookup failed.',
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          User Data Rights & Compliance
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          User Data Deletion Instructions & Portal
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          In compliance with Meta Platform Policies, the Digital Personal Data Protection Act (DPDPA), and GDPR, <strong>MetaGreenWave by Digi8 Solutions</strong> provides full self-service mechanisms to remove your personal data, customer contacts, and connected WhatsApp Business Account credentials.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('submit')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'submit'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Request Data Deletion</span>
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'lookup'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Track Request Status</span>
        </button>

        <button
          onClick={() => setActiveTab('meta_instructions')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'meta_instructions'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Meta Facebook App Instructions</span>
        </button>
      </div>

      {/* Tab 1: Submit Request */}
      {activeTab === 'submit' && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 text-base">Submit an Account or Data Deletion Request</h3>
            <p>
              Fill out this form to request permanent erasure of your account, contact records, communication history, and encrypted WhatsApp Cloud API tokens. Your request will be processed immediately by our automated compliance system or within 48 hours for complex enterprise workspaces.
            </p>
          </div>

          {submitResult && (
            <div
              className={`p-5 rounded-2xl border text-xs sm:text-sm space-y-2 ${
                submitResult.error
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              {submitResult.error ? (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Request Submission Failed:</strong>
                    <p>{submitResult.message}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-base text-emerald-900">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>Data Deletion Request Initiated</span>
                  </div>
                  <p>{submitResult.message}</p>
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 font-mono text-xs">
                    <div>
                      <span className="text-slate-500">Confirmation Code: </span>
                      <strong className="text-slate-900 select-all">{submitResult.confirmation_code}</strong>
                    </div>
                    {submitResult.url && (
                      <div className="mt-1">
                        <span className="text-slate-500">Status Tracking URL: </span>
                        <a
                          href={submitResult.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 underline break-all inline-flex items-center gap-1"
                        >
                          <span>{submitResult.url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Please store your Confirmation Code. You can check the deletion progress anytime under the "Track Request Status" tab.
                  </p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs mb-1">
                Your Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs mb-1">
                Associated Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs mb-1">
                Registered Phone Number or WABA ID (Optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91... or WABA ID"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs mb-1">
                Specific Deletion Details or Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please state if you require deletion of a specific phone number or entire organization workspace."
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Request...' : 'Submit Permanent Deletion Request'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Track Status */}
      {activeTab === 'lookup' && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 text-base">Check Data Deletion Status</h3>
            <p>
              Enter the unique Confirmation Code received when you submitted your data deletion request or when your request was initiated via Meta's platform callback.
            </p>
          </div>

          <form onSubmit={handleLookupStatus} className="flex gap-2">
            <input
              type="text"
              required
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              placeholder="e.g. DEL-ABC12345DEF"
              className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs sm:text-sm uppercase tracking-wider"
            />
            <button
              type="submit"
              disabled={isLookingUp}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 text-xs sm:text-sm"
            >
              <Search className="w-4 h-4" />
              <span>{isLookingUp ? 'Searching...' : 'Lookup Status'}</span>
            </button>
          </form>

          {lookupResult && (
            <div className="p-6 rounded-2xl border bg-white border-slate-200 shadow-xs space-y-4 text-xs sm:text-sm">
              {lookupResult.error ? (
                <div className="text-rose-700 flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{lookupResult.message}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-sm">Request Confirmation Code:</span>
                    <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                      {lookupResult.confirmation_code}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 block text-xs">Current Status:</span>
                      <span
                        className={`inline-block mt-1 font-bold text-xs px-2.5 py-1 rounded-full uppercase ${
                          lookupResult.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lookupResult.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {lookupResult.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-xs">Request Source:</span>
                      <strong className="text-slate-800 capitalize">{lookupResult.request_type || 'Portal'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-xs">Created At:</span>
                      <span className="text-slate-700">
                        {lookupResult.created_at ? new Date(lookupResult.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-xs">Completed At:</span>
                      <span className="text-slate-700">
                        {lookupResult.completed_at ? new Date(lookupResult.completed_at).toLocaleString() : 'Processing'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    {lookupResult.status === 'completed'
                      ? '✅ All requested user data, tokens, and records associated with this request have been permanently purged from our active MySQL databases.'
                      : '⏳ Your request is currently queued for automated verification and deletion. Most requests complete within minutes.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Meta App Instructions */}
      {activeTab === 'meta_instructions' && (
        <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900">
            How to Remove MetaGreenWave from your Meta / Facebook Account
          </h2>
          <p>
            If you connected your WhatsApp Business Account through Meta Facebook Login or Embedded Signup, you can revoke application permissions and trigger automated deletion directly from your Meta user settings:
          </p>

          <ol className="list-decimal list-inside space-y-3 pl-2 text-slate-800">
            <li>
              Log into your Facebook account and navigate to <strong>Settings & Privacy &gt; Settings</strong>.
            </li>
            <li>
              In the left navigation menu, click on <strong>Apps and Websites</strong>.
            </li>
            <li>
              Find <strong>MetaGreenWave</strong> in the list of active connected applications.
            </li>
            <li>
              Click the <strong>Remove</strong> button.
            </li>
            <li>
              In the confirmation dialog, check the box to request deletion of all posts, videos, or events that the app may have published, then click <strong>Remove</strong>.
            </li>
            <li>
              Meta will automatically dispatch a secure cryptographic <code>signed_request</code> to our server callback URL (<code>https://metagreenwave.com/api/v1/meta/data-deletion</code>), which disconnects your credentials and schedules complete data purging.
            </li>
          </ol>

          <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200 text-brand-900 space-y-1">
            <strong>Direct Assistance & Questions:</strong>
            <p>
              You can also contact our Data Protection Office directly at <a href="mailto:hello@digi8solutions.com" className="underline font-bold">hello@digi8solutions.com</a> with your business details to request manual verification and immediate certificate of erasure.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
