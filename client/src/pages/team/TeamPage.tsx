import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UsersRound, Plus, ShieldCheck, Mail, X, History, Trash2 } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { activeOrg, user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('support_agent');
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const fetchData = () => {
    Promise.all([
      api.get('/team/members'),
      api.get('/team/audit-logs'),
    ])
      .then(([mems, logs]) => {
        setMembers(mems);
        setAuditLogs(logs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [activeOrg?.id]);

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    try {
      await api.patch(`/team/members/${membershipId}/role`, { role: newRole });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (confirm('Remove this member from workspace?')) {
      await api.delete(`/team/members/${membershipId}`);
      fetchData();
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/team/invite', { email: inviteEmail, role: inviteRole });
      setInviteLink(res.inviteLink);
      setInviteEmail('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Invitation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-brand-600" />
            <span>Team & Role-Based Permissions (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage workspace collaborators, fine-grained access tiers, and security audit history
          </p>
        </div>

        <button
          onClick={() => {
            setInviteLink(null);
            setInviteModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Workspace Members ({members.length})</h2>
          <span className="text-[11px] text-slate-400">Least-Privilege Isolation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Role Capabilities</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.membership_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 border border-brand-300 flex items-center justify-center font-bold text-xs">
                        {m.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div>{m.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.membership_id, e.target.value)}
                      disabled={m.role === 'owner'}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-bold text-slate-800 disabled:bg-slate-100"
                    >
                      <option value="owner">Organization Owner</option>
                      <option value="admin">Administrator</option>
                      <option value="campaign_manager">Campaign Manager</option>
                      <option value="support_agent">Support Agent</option>
                      <option value="analyst">Analyst</option>
                      <option value="billing_manager">Billing Manager</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {m.role === 'owner' && 'Full permissions & billing control'}
                    {m.role === 'admin' && 'Workflows, templates, API keys, campaigns'}
                    {m.role === 'campaign_manager' && 'Campaigns, templates, audiences'}
                    {m.role === 'support_agent' && 'Shared inbox, customer replies'}
                    {m.role === 'analyst' && 'Read-only analytics and reports'}
                    {m.role === 'billing_manager' && 'Invoices, wallet top-up, subscriptions'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{new Date(m.joined_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m.membership_id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-sm text-slate-900">Security & Workspace Action Logs</h2>
          </div>
          <span className="text-[11px] text-slate-400">Tamper-Proof Audit</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No security events logged yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource Type</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{log.user_email || 'system'}</td>
                    <td className="px-4 py-3 font-bold text-brand-900">{log.action}</td>
                    <td className="px-4 py-3 text-slate-600">{log.resource_type}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Invite Team Member</h3>
              <button onClick={() => setInviteModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Collaborator Email</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Access Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="admin">Administrator</option>
                  <option value="campaign_manager">Campaign Manager</option>
                  <option value="support_agent">Support Agent</option>
                  <option value="analyst">Analyst</option>
                  <option value="billing_manager">Billing Manager</option>
                </select>
              </div>

              {inviteLink && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-950">Invitation Created:</div>
                  <code className="block bg-white p-2 rounded border border-emerald-200 text-brand-900 font-mono text-[10px] break-all select-all">
                    {inviteLink}
                  </code>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Generate Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
