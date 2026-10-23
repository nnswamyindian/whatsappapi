import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserCheck, ShieldAlert, Plus, Trash2, ShieldCheck, History } from 'lucide-react';

export const AudiencesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suppression' | 'consent'>('suppression');
  const [suppressionList, setSuppressionList] = useState<any[]>([]);
  const [consentLedger, setConsentLedger] = useState<any[]>([]);
  const [newSuppPhone, setNewSuppPhone] = useState('');
  const [newSuppReason, setNewSuppReason] = useState('user_optout');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      api.get('/contacts/suppression-list'),
      api.get('/contacts/consent-ledger'),
    ])
      .then(([supp, consent]) => {
        setSuppressionList(supp);
        setConsentLedger(consent);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppPhone) return;
    try {
      await api.post('/contacts/suppression-list', { phone: newSuppPhone, reason: newSuppReason });
      setNewSuppPhone('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add to suppression list');
    }
  };

  const handleRemoveSuppression = async (phone: string) => {
    if (confirm(`Remove ${phone} from suppression blocklist?`)) {
      await api.delete(`/contacts/suppression-list/${encodeURIComponent(phone)}`);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-600" />
            <span>Audiences, Consent & Suppression</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit consent provenance and enforce mandatory opt-out suppression to protect WhatsApp account quality
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('suppression')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'suppression'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suppression List ({suppressionList.length})
          </button>
          <button
            onClick={() => setActiveTab('consent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'consent'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Consent Ledger ({consentLedger.length})
          </button>
        </div>
      </div>

      {/* Suppression List Tab */}
      {activeTab === 'suppression' && (
        <div className="space-y-6">
          {/* Add to suppression form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Add Number to WhatsApp Suppression Blocklist</span>
            </h2>
            <form onSubmit={handleAddSuppression} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="+919876543210 (Phone with country code)"
                value={newSuppPhone}
                onChange={(e) => setNewSuppPhone(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-brand-500"
                required
              />
              <select
                value={newSuppReason}
                onChange={(e) => setNewSuppReason(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="user_optout">Customer Opt-Out (STOP Reply)</option>
                <option value="spam_complaint">Spam Complaint</option>
                <option value="hard_bounce">Undeliverable / Number Inactive</option>
                <option value="compliance_block">Legal Compliance Block</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
              >
                Add Suppression Block
              </button>
            </form>
          </div>

          {/* Suppression table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900">Blocked Phone Numbers ({suppressionList.length})</h3>
              <span className="text-[11px] text-slate-400">Pre-flight excluded from all campaigns</span>
            </div>

            {suppressionList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No numbers currently on suppression list
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Phone (E.164)</th>
                      <th className="px-4 py-3">Block Reason</th>
                      <th className="px-4 py-3">Added Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppressionList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-rose-950">{item.phone_e164}</td>
                        <td className="px-4 py-3">
                          <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-semibold text-[10px]">
                            {item.reason}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveSuppression(item.phone_e164)}
                            className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
                          >
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consent Ledger Tab */}
      {activeTab === 'consent' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-xs text-slate-900">Immutable Consent Audit Trail</h3>
            </div>
            <span className="text-[11px] text-slate-400">WhatsApp Messaging Compliance</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Source Channel</th>
                  <th className="px-4 py-3">Evidence Description</th>
                  <th className="px-4 py-3">Logged Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {consentLedger.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-semibold">{c.phone_e164}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          c.status === 'opted_in'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium capitalize">{c.purpose}</td>
                    <td className="px-4 py-3 text-slate-600">{c.source}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{c.evidence || '-'}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(c.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
