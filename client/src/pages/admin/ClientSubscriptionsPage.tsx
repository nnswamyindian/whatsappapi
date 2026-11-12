import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DollarSign, TrendingUp, Users, Calendar, AlertCircle, Edit, CheckCircle } from 'lucide-react';

export const ClientSubscriptionsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [overridePlan, setOverridePlan] = useState('growth');
  const [overrideStatus, setOverrideStatus] = useState('active');
  const [renewalDays, setRenewalDays] = useState('30');
  const [saving, setSaving] = useState(false);

  const fetchSubscriptions = () => {
    setLoading(true);
    api.get('/admin/subscriptions')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSaving(true);

    try {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + parseInt(renewalDays, 10));

      await api.post(`/admin/subscriptions/${selectedSub.organization_id}/override`, {
        planSlug: overridePlan,
        status: overrideStatus,
        renewalDate: nextDate.toISOString(),
      });

      setSelectedSub(null);
      fetchSubscriptions();
      alert('Client subscription successfully updated.');
    } catch (err: any) {
      alert(err.message || 'Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Provider Financial Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Monthly Recurring Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${(data?.metrics?.mrr || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">/ mo</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live platform MRR
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Annual Run Rate (ARR)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${(data?.metrics?.arr || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">/ yr</span>
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Projected annual platform revenue</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Active Paid Clients</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {data?.metrics?.activePaidClients || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Out of {data?.metrics?.totalOrganizations || 0} total registered tenants
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Average Revenue / Client</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${data?.metrics?.arpu || 0} <span className="text-xs font-normal text-slate-400">/ client</span>
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Platform ARPU</div>
        </div>
      </div>

      {/* Client Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Client Business Subscriptions & Renewals</h2>
            <p className="text-xs text-slate-500">
              Overview of all purchasing businesses, active tiers, renewal dates, and manual subscription controls.
            </p>
          </div>
          <button
            onClick={fetchSubscriptions}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                <th className="p-3.5">Business / Client</th>
                <th className="p-3.5">Owner / Contact</th>
                <th className="p-3.5">Active Plan</th>
                <th className="p-3.5">Billing Cycle</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Renewal Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">
                    Loading client subscriptions...
                  </td>
                </tr>
              ) : data?.subscriptions?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">
                    No client subscriptions found.
                  </td>
                </tr>
              ) : (
                data?.subscriptions?.map((sub: any) => (
                  <tr key={sub.organization_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{sub.org_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">slug: {sub.org_slug}</div>
                    </td>
                    <td className="p-3.5">
                      <div>{sub.owner_name || 'Administrator'}</div>
                      <div className="text-[11px] text-slate-500">{sub.owner_email || '—'}</div>
                      {sub.phone_e164 && (
                        <div className="text-[10px] text-emerald-700 font-mono">{sub.phone_e164}</div>
                      )}
                    </td>
                    <td className="p-3.5 font-bold">
                      <span className="capitalize text-slate-900">{sub.plan_name || sub.current_tier}</span>
                      <div className="text-[10px] text-slate-400">
                        ${sub.monthly_price_usd ? sub.monthly_price_usd : '29'}/mo
                      </div>
                    </td>
                    <td className="p-3.5 capitalize">{sub.billing_cycle || 'monthly'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'active' || (!sub.status && sub.current_tier)
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sub.status || 'active'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {sub.renewal_date ? (
                        <div>
                          <div className="font-medium text-slate-900">
                            {new Date(sub.renewal_date).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {Math.ceil(
                              (new Date(sub.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                            )}{' '}
                            days remaining
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Trial period</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setOverridePlan(sub.current_tier || 'growth');
                          setOverrideStatus(sub.status || 'active');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                      >
                        <Edit className="w-3 h-3" /> Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Subscription Override Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Override Subscription: {selectedSub.org_name}
              </h3>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOverride} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Subscription Tier</label>
                <select
                  value={overridePlan}
                  onChange={(e) => setOverridePlan(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-medium"
                >
                  <option value="starter">Starter Plan ($29/mo)</option>
                  <option value="growth">Growth Business ($79/mo)</option>
                  <option value="enterprise">Enterprise Dedicated ($199/mo)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subscription Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-medium"
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="trial">Trial Period</option>
                  <option value="past_due">Past Due / Grace Period</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Extend Access Duration</label>
                <select
                  value={renewalDays}
                  onChange={(e) => setRenewalDays(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-medium"
                >
                  <option value="14">+14 Days Extension</option>
                  <option value="30">+30 Days (1 Month)</option>
                  <option value="90">+90 Days (Quarterly)</option>
                  <option value="365">+365 Days (1 Year Access)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Apply Subscription Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

