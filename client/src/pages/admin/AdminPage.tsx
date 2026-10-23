import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldAlert, Building2, CheckCircle2, AlertTriangle, Users, MessageSquare } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AdminPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/organizations'),
    ])
      .then(([ov, orgs]) => {
        setOverview(ov);
        setOrganizations(orgs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (confirm(`Change organization status to ${nextStatus.toUpperCase()}?`)) {
      await api.patch(`/admin/organizations/${id}/status`, { status: nextStatus });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-purple-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-300" />
            <h1 className="text-xl font-bold tracking-tight">GreenWave Platform Master Control</h1>
          </div>
          <p className="text-xs text-purple-200 mt-1">
            Global multi-tenant governance, queue telemetry, and system-wide service health
          </p>
        </div>
        <span className="bg-purple-800 border border-purple-700 text-purple-200 px-3 py-1 rounded-full text-xs font-mono font-bold self-start sm:self-auto">
          Super-Admin Access
        </span>
      </div>

      {/* Global Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Total SaaS Tenants</div>
          <div className="text-2xl font-bold text-slate-900">{overview?.tenants?.total || 0}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {overview?.tenants?.active || 0} active organizations
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Global System Users</div>
          <div className="text-2xl font-bold text-slate-900">{overview?.users || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all workspaces</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Total Dispatched Messages</div>
          <div className="text-2xl font-bold text-slate-900">{overview?.messaging?.total || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {overview?.messaging?.outbound || 0} outbound
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Queue & Engine Health</div>
          <div className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Worker Queue Active</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {overview?.systemHealth?.activeCampaignWorkers || 0} active workers
          </div>
        </div>
      </div>

      {/* All Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Tenant Workspaces Overview</h2>
          <span className="text-[11px] text-slate-400">Multi-Tenant Scoping</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Organization Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Plan Tier</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Contacts</th>
                <th className="px-4 py-3">Provider Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{org.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{org.slug}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
                      {org.plan_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{org.member_count}</td>
                  <td className="px-4 py-3 font-mono">{org.contact_count}</td>
                  <td className="px-4 py-3 uppercase font-mono font-semibold text-slate-700">
                    {org.whatsapp_mode || 'sandbox'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={org.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(org.id, org.status)}
                      className={`text-xs font-bold ${
                        org.status === 'active' ? 'text-rose-600 hover:underline' : 'text-emerald-700 hover:underline'
                      }`}
                    >
                      {org.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
