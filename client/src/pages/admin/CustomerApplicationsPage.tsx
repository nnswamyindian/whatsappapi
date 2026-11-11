import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  Tag,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';

export const CustomerApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);

  // Review modal state
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_info' | 'notes' | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const data = await api.get(`/admin/applications?${params.toString()}`);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, search]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/applications/${id}/approve`);
      await fetchApplications();
      setSelectedApp(null);
      setActionType(null);
      alert('Application approved successfully! Approval email dispatched.');
    } catch (err: any) {
      alert(err.message || 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!reason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/admin/applications/${id}/reject`, { reason });
      await fetchApplications();
      setSelectedApp(null);
      setActionType(null);
      setReason('');
      alert('Application rejected and notification email sent.');
    } catch (err: any) {
      alert(err.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async (id: string) => {
    if (!reason.trim()) {
      alert('Please specify the details requested.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/admin/applications/${id}/request-info`, { requestDetails: reason });
      await fetchApplications();
      setSelectedApp(null);
      setActionType(null);
      setReason('');
      alert('Information request sent to customer.');
    } catch (err: any) {
      alert(err.message || 'Failed to request info');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async (id: string) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/applications/${id}/notes`, { notes: reason });
      await fetchApplications();
      setActionType(null);
      setReason('');
      alert('Internal notes saved.');
    } catch (err: any) {
      alert(err.message || 'Failed to save notes');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer Applications & Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, verify, and approve incoming business registrations for WhatsApp access.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 text-xs font-bold w-full sm:w-auto">
          {['all', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTION_REQUIRED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st.replace('_', ' ').toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business, email..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Business & Owner</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Category & Country</th>
                <th className="p-3.5">Email Verified</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Submitted</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{app.business_name}</div>
                    <div className="text-[11px] text-slate-500">{app.owner_name}</div>
                  </td>
                  <td className="p-3.5">
                    <div>{app.email}</div>
                    <div className="text-[11px] text-slate-500">{app.phone_e164}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{app.business_category}</div>
                    <div className="text-[11px] text-slate-500">Country: {app.country}</div>
                  </td>
                  <td className="p-3.5">
                    {app.email_verified ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Unconfirmed
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {app.status === 'PENDING_APPROVAL' && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        Pending Review
                      </span>
                    )}
                    {app.status === 'APPROVED' && (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        Approved
                      </span>
                    )}
                    {app.status === 'REJECTED' && (
                      <span className="bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        Rejected
                      </span>
                    )}
                    {app.status === 'ACTION_REQUIRED' && (
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        Action Required
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setActionType(null);
                        setReason(app.admin_notes || '');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 rounded-lg text-xs font-bold transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-700" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No customer applications found matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Application Review</h3>
                <p className="text-xs text-slate-500">ID: {selectedApp.id}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Business Legal Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedApp.business_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Owner / Admin Name:</span>
                <span className="font-bold text-slate-900">{selectedApp.owner_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Official Work Email:</span>
                <span className="font-semibold text-slate-800">{selectedApp.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">WhatsApp Phone:</span>
                <span className="font-semibold text-slate-800">{selectedApp.phone_e164}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Category:</span>
                <span className="font-semibold text-slate-800">{selectedApp.business_category}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Website:</span>
                <span className="text-brand-700 underline truncate block">{selectedApp.website || 'N/A'}</span>
              </div>
            </div>

            {/* Intended Usage */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Intended WhatsApp Messaging Use Case:</label>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                {selectedApp.intended_usage || 'No use case provided.'}
              </div>
            </div>

            {/* Internal Notes Display */}
            {selectedApp.admin_notes && (
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-700">Internal Admin Notes:</label>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900">
                  {selectedApp.admin_notes}
                </div>
              </div>
            )}

            {/* Sub-Action Forms */}
            {actionType === 'reject' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
                <label className="font-bold text-rose-900">Rejection Reason (will be emailed to customer) *</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this application cannot be approved..."
                  className="w-full p-2.5 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 bg-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'request_info' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-xs">
                <label className="font-bold text-blue-900">Information Needed from Customer *</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Please provide GSTIN / EIN verification document..."
                  className="w-full p-2.5 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRequestInfo(selectedApp.id)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    {actionLoading ? 'Sending...' : 'Send Info Request'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'notes' && (
              <div className="p-4 bg-slate-100 rounded-2xl space-y-2 text-xs">
                <label className="font-bold text-slate-800">Add / Update Internal Admin Notes</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Confidential notes for team admins..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveNotes(selectedApp.id)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-slate-900 text-white font-bold rounded-lg shadow-sm"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActionType('notes');
                    setReason(selectedApp.admin_notes || '');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Notes
                </button>
                <button
                  onClick={() => {
                    setActionType('request_info');
                    setReason('');
                  }}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl"
                >
                  Request Info
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedApp.status !== 'REJECTED' && (
                  <button
                    onClick={() => {
                      setActionType('reject');
                      setReason('');
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors"
                  >
                    Reject Application
                  </button>
                )}

                {selectedApp.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Customer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

