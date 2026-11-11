import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Edit2,
  TrendingUp,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';

export const TenantManagementPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchTenants = async () => {
    try {
      const data = await api.get('/admin/tenants');
      setTenants(data);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await api.patch(`/admin/tenants/${editingTenant.id}`, {
        status: editingTenant.status,
        planTier: editingTenant.plan_tier,
        contactLimit: parseInt(editingTenant.contact_limit, 10),
        teamLimit: parseInt(editingTenant.team_limit, 10),
        campaignLimit: parseInt(editingTenant.campaign_limit, 10),
      });
      await fetchTenants();
      setEditingTenant(null);
      alert('Tenant updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update tenant');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tenant & Customer Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversee workspace health, assign subscription tiers, adjust quotas, and manage status.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Workspace</th>
                <th className="p-3.5">Plan Tier</th>
                <th className="p-3.5">WhatsApp Connection</th>
                <th className="p-3.5">Contacts</th>
                <th className="p-3.5">Team</th>
                <th className="p-3.5">Wallet</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{t.slug}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold uppercase tracking-wide text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-900 border border-brand-200">
                      {t.plan_tier}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {t.whatsapp_status === 'connected' ? (
                      <div>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t.display_phone_number || 'Connected'}
                        </span>
                        <div className="text-[10px] text-slate-400 capitalize">{t.whatsapp_mode} mode</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium">Not Connected</span>
                    )}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    {t.contact_count} / {t.contact_limit || 1000}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    {t.member_count} / {t.team_limit || 3}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">
                    ${(t.wallet_balance || 0).toFixed(2)}
                  </td>
                  <td className="p-3.5">
                    {t.status === 'active' ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        Active
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setEditingTenant({ ...t })}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Tenant Workspace</h3>
                <p className="text-xs text-slate-500">{editingTenant.name}</p>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subscription Plan Tier</label>
                <select
                  value={editingTenant.plan_tier}
                  onChange={(e) => setEditingTenant({ ...editingTenant, plan_tier: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold bg-white"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Limit</label>
                  <input
                    type="number"
                    value={editingTenant.contact_limit || 1000}
                    onChange={(e) => setEditingTenant({ ...editingTenant, contact_limit: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Team Limit</label>
                  <input
                    type="number"
                    value={editingTenant.team_limit || 3}
                    onChange={(e) => setEditingTenant({ ...editingTenant, team_limit: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campaign Limit</label>
                  <input
                    type="number"
                    value={editingTenant.campaign_limit || 50}
                    onChange={(e) => setEditingTenant({ ...editingTenant, campaign_limit: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Status</label>
                <select
                  value={editingTenant.status}
                  onChange={(e) => setEditingTenant({ ...editingTenant, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold bg-white"
                >
                  <option value="active">Active (Messaging Enabled)</option>
                  <option value="suspended">Suspended (All Queues Halted)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

