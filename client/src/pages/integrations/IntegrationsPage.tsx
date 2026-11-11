import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { WhatsAppConnection } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  Lock,
  RefreshCw,
  ExternalLink,
  Smartphone,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const { activeOrg } = useAuth();
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Meta Cloud API Form
  const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox');
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('greenwave_verify_token_prod_99');
  const [savingConn, setSavingConn] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // API Key Generator
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // OTP Tester Tool
  const [otpPhone, setOtpPhone] = useState('+919876543210');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpSession, setOtpSession] = useState<any>(null);
  const [otpVerifyResult, setOtpVerifyResult] = useState<any>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // Meta Embedded Signup v4 State
  const [embeddedLoading, setEmbeddedLoading] = useState(false);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchData = () => {
    Promise.all([
      api.get<WhatsAppConnection>('/whatsapp/status'),
      api.get('/api-keys'),
    ])
      .then(([conn, keys]) => {
        setConnection(conn);
        setMode(conn.mode || 'sandbox');
        setWabaId(conn.waba_id || '');
        setPhoneNumberId(conn.phone_number_id || '');
        setApiKeys(keys);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();

    // Listen for Meta Embedded Signup v4 Window Message Events
    const handleMetaMessage = async (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== window.location.origin) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('[Meta Embedded Signup Event Received]:', data);
          if (data.event === 'FINISH' || data.data?.phone_number_id) {
            setEmbeddedLoading(true);
            await api.post('/whatsapp/embedded-signup/exchange', {
              wabaId: data.data?.waba_id,
              phoneNumberId: data.data?.phone_number_id,
              code: data.data?.code,
            });
            fetchData();
            setEmbeddedLoading(false);
          }
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleMetaMessage);
    return () => window.removeEventListener('message', handleMetaMessage);
  }, [activeOrg?.id]);

  const handleLaunchEmbeddedSignup = async () => {
    setEmbeddedLoading(true);
    // If FB SDK is loaded and Meta App ID is configured
    const metaAppId = (connection as any)?.metaAppId;
    const metaConfigId = (connection as any)?.metaConfigId;

    if ((window as any).FB && metaAppId && metaConfigId) {
      (window as any).FB.login(
        async (response: any) => {
          if (response.authResponse?.code) {
            try {
              await api.post('/whatsapp/embedded-signup/exchange', {
                code: response.authResponse.code,
              });
              alert('Meta WhatsApp Embedded Signup completed successfully!');
              fetchData();
            } catch (e: any) {
              alert(e.message || 'Embedded signup exchange failed');
            }
          }
          setEmbeddedLoading(false);
        },
        {
          config_id: metaConfigId,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            feature: 'whatsapp_embedded_signup',
            version: 2,
          },
        }
      );
    } else {
      // Prompt guided setup for customer or administrator
      const inputWaba = prompt('Enter your Meta WhatsApp Business Account (WABA) ID:', wabaId || '109284102938120');
      if (!inputWaba) {
        setEmbeddedLoading(false);
        return;
      }
      const inputPhoneId = prompt('Enter your registered Phone Number ID:', phoneNumberId || '104928192837192');
      if (!inputPhoneId) {
        setEmbeddedLoading(false);
        return;
      }

      try {
        const res = await api.post('/whatsapp/embedded-signup/exchange', {
          wabaId: inputWaba,
          phoneNumberId: inputPhoneId,
        });
        alert(res.message || 'WhatsApp Business Connected successfully!');
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Onboarding failed');
      } finally {
        setEmbeddedLoading(false);
      }
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp Business Account? The workspace will revert to Sandbox mode.')) return;
    try {
      await api.post('/whatsapp/disconnect');
      alert('WhatsApp disconnected successfully');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Disconnect failed');
    }
  };

  const handleSyncTemplates = async () => {
    setSyncingTemplates(true);
    setSyncResult(null);
    try {
      const res = await api.post('/whatsapp/sync-templates');
      setSyncResult(`Synced ${res.syncedTotal} templates (${res.updatedCount} updated, ${res.createdCount} new).`);
      fetchData();
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err.message}`);
    } finally {
      setSyncingTemplates(false);
    }
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConn(true);
    try {
      await api.post('/whatsapp/configure', {
        mode,
        wabaId,
        phoneNumberId,
        accessToken: accessToken || undefined,
        webhookVerifyToken,
      });
      alert(`WhatsApp provider configuration updated to ${mode.toUpperCase()} mode with encrypted credentials.`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Configuration failed');
    } finally {
      setSavingConn(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestResult(null);
    try {
      const res = await api.post('/whatsapp/test-connection');
      setTestResult(res);
      fetchData();
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTestingConn(false);
    }
  };

  const handleGenerateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await api.post('/api-keys', { name: newKeyName });
      setCreatedSecret(res.apiKey);
      setNewKeyName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Key generation failed');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (confirm('Revoke this API Key permanently?')) {
      await api.delete(`/api-keys/${id}`);
      fetchData();
    }
  };

  // OTP Test Handlers
  const handleRequestOtp = async () => {
    setOtpLoading(true);
    setOtpVerifyResult(null);
    try {
      const res = await api.post('/auth/otp/request', { phone: otpPhone });
      setOtpSession(res);
      if (res.sandboxHint) {
        alert(res.sandboxHint);
      }
    } catch (err: any) {
      alert(err.message || 'OTP request failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await api.post('/auth/otp/verify', {
        phone: otpPhone,
        code: otpCodeInput,
        otpId: otpSession?.otpId,
      });
      setOtpVerifyResult(res);
    } catch (err: any) {
      setOtpVerifyResult({ error: err.message });
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-600" />
            <span>API, Integrations & Security Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure official Meta WhatsApp Cloud API credentials, scoped server-to-server API keys, and test OTPs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={connection?.mode === 'live' ? 'CONNECTED' : 'PAUSED'} size="sm" />
          <span className="text-xs font-bold text-slate-700 uppercase">
            {connection?.mode || 'sandbox'} Mode
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Official Meta WhatsApp Cloud API Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <div>
                <h2 className="font-bold text-sm text-slate-900">Meta WhatsApp Cloud API (v4 Onboarding)</h2>
                <div className="text-[10px] text-slate-400">Official Meta Graph API v21.0/v22.0 Integration</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncTemplates}
                disabled={syncingTemplates}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold text-xs flex items-center gap-1"
                title="Synchronize templates from Meta"
              >
                <RefreshCw className={`w-3 h-3 ${syncingTemplates ? 'animate-spin' : ''}`} />
                <span>Sync Templates</span>
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testingConn}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold text-xs flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${testingConn ? 'animate-spin' : ''}`} />
                <span>Test API</span>
              </button>
            </div>
          </div>

          {syncResult && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              {syncResult}
            </div>
          )}

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="font-bold">{testResult.ok ? 'Connection Verified' : 'Connection Error'}</div>
              <div>{testResult.message}</div>
            </div>
          )}

          {/* Embedded Signup v4 Onboarding Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-brand-50 to-teal-500/10 border border-brand-200/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Connect WhatsApp Business Account</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-600 text-white">
                    Meta v4 Flow
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  Connect your business via official Facebook Login for Business. Automatically selects or creates your WABA, registers your phone number, configures webhooks, and synchronizes approved templates.
                </p>
              </div>
            </div>

            {connection?.mode === 'live' && connection?.status === 'connected' ? (
              /* Live Connection Profile Card */
              <div className="bg-white p-3.5 rounded-xl border border-brand-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{connection.verified_name || 'Verified WhatsApp Business'}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Quality: {connection.quality_rating || 'GREEN'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 font-mono">
                  <div>
                    <span className="text-slate-400">Phone:</span>{' '}
                    <strong className="text-slate-800">{connection.display_phone_number || 'Registered'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">WABA ID:</span>{' '}
                    <strong className="text-slate-800">{connection.waba_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Phone ID:</span>{' '}
                    <strong className="text-slate-800">{connection.phone_number_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Storage:</span>{' '}
                    <strong className="text-teal-700">AES-256-GCM Encrypted</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Token: {(connection as any)?.accessTokenMasked || '••••••••••••••••'}
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              /* Disconnected CTA Button */
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleLaunchEmbeddedSignup}
                  disabled={embeddedLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {embeddedLoading
                      ? 'Connecting to Meta...'
                      : 'Launch Meta WhatsApp Embedded Signup v4'}
                  </span>
                </button>
                <div className="text-[10px] text-slate-500 text-center mt-1.5">
                  Safe self-service authorization • No permanent tokens shared with browser
                </div>
              </div>
            )}
          </div>

          {/* Webhook Endpoint Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Your Official Meta Webhook URL:</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                GET Challenge & HMAC SHA-256 Active
              </span>
            </div>
            <code className="block bg-white p-2 rounded border border-slate-200 text-brand-900 font-mono text-[11px] break-all select-all">
              {window.location.origin}/api/v1/webhooks/whatsapp
            </code>
            <div className="text-[10px] text-slate-500">
              Verify Token: <strong className="font-mono">{webhookVerifyToken}</strong>
            </div>
          </div>

          {/* Collapsible Manual / Developer Fallback */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowManualSetup(!showManualSetup)}
              className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left text-xs font-bold text-slate-700 transition-colors"
            >
              <span>⚙️ Developer / Manual Credential Fallback</span>
              <span className="text-slate-400 text-[10px]">{showManualSetup ? '▲ Hide' : '▼ Expand'}</span>
            </button>

            {showManualSetup && (
              <form onSubmit={handleSaveConnection} className="p-3 bg-white space-y-3 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operational Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('sandbox')}
                      className={`p-2 rounded-lg border font-bold text-xs transition-all ${
                        mode === 'sandbox'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Sandbox Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('live')}
                      className={`p-2 rounded-lg border font-bold text-xs transition-all ${
                        mode === 'live'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Live Meta Cloud
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WABA ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 109284102938120"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 104928192837192"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    System User Access Token (Encrypted at rest with AES-256-GCM)
                  </label>
                  <input
                    type="password"
                    placeholder="EAABw..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingConn}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 text-xs"
                >
                  {savingConn ? 'Saving...' : 'Save Manual Configuration'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Section 2: Live Cryptographic OTP Verification Tester */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brand-600" />
              <h2 className="font-bold text-sm text-slate-900">WhatsApp OTP Verification Tester</h2>
            </div>
            <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">
              SHA256 Hashed
            </span>
          </div>

          <p className="text-slate-500 text-xs">
            Test single-use cryptographic WhatsApp OTPs with strict 3-attempt limits, anti-abuse cooldown, and tamper-proof verification.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Phone Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpLoading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50 shrink-0"
                >
                  Request OTP
                </button>
              </div>
            </div>

            {otpSession && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>OTP Code Dispatched</span>
                  <span className="text-[10px] text-emerald-800 font-normal">Session: {otpSession.otpId.substring(0, 8)}...</span>
                </div>
                {otpSession.sandboxHint && (
                  <div className="p-2 bg-white rounded border border-emerald-300 text-brand-900 font-mono font-bold text-[11px]">
                    {otpSession.sandboxHint}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-center tracking-widest text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || !otpCodeInput}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                  >
                    Verify Code
                  </button>
                </div>
              </div>
            )}

            {otpVerifyResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  otpVerifyResult.verified
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {otpVerifyResult.verified
                  ? `✅ Success! OTP verified and permanently invalidated (single-use).`
                  : `❌ Verification failed: ${otpVerifyResult.error}`}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Scoped API Keys Management (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Server-to-Server Scoped API Keys</h2>
              <p className="text-[11px] text-slate-500">Authenticate external commerce systems, CRM, and OTP requests</p>
            </div>

            <form onSubmit={handleGenerateApiKey} className="flex gap-2">
              <input
                type="text"
                placeholder="Key Description (e.g. Backend API)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                required
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Key</span>
              </button>
            </form>
          </div>

          {createdSecret && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>API Key Generated — Copy Now (Displayed Once)</span>
              </div>
              <code className="block bg-white p-2.5 rounded border border-amber-200 font-mono text-xs text-amber-950 select-all break-all">
                {createdSecret}
              </code>
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Key Name</th>
                  <th className="px-4 py-3">Prefix</th>
                  <th className="px-4 py-3">Scopes</th>
                  <th className="px-4 py-3">Last Used</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{k.key_prefix}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {k.permissions?.map((p: string, idx: number) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="text-slate-400 hover:text-rose-600 font-semibold"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
