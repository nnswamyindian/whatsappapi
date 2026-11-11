import React, { useEffect, useState } from 'react';
import { CreditCard, Edit2, Plus, Check, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export const SubscriptionPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchPlans = async () => {
    try {
      const data = await api.get('/admin/plans');
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await api.put(`/admin/plans/${editingPlan.id}`, {
        name: editingPlan.name,
        description: editingPlan.description,
        monthlyPriceUsd: parseFloat(editingPlan.monthly_price_usd),
        yearlyPriceUsd: parseFloat(editingPlan.yearly_price_usd),
        contactLimit: parseInt(editingPlan.contact_limit, 10),
        teamMemberLimit: parseInt(editingPlan.team_member_limit, 10),
        campaignLimit: parseInt(editingPlan.campaign_limit, 10),
        wabaLimit: parseInt(editingPlan.waba_limit, 10),
        isActive: editingPlan.is_active,
      });
      await fetchPlans();
      setEditingPlan(null);
      alert('Plan updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Subscription & Reseller Plans
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure platform pricing, contact quotas, team seats, and feature entitlements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          let features: string[] = [];
          try {
            features = JSON.parse(p.features_json || '[]');
          } catch (e) {}

          return (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-lg">{p.name}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
                    {p.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  ${p.monthly_price_usd}
                  <span className="text-xs text-slate-500 font-normal"> / mo</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div><strong>Contacts:</strong> {p.contact_limit.toLocaleString()}</div>
                  <div><strong>Team Seats:</strong> {p.team_member_limit}</div>
                  <div><strong>Campaigns:</strong> {p.campaign_limit} / mo</div>
                  <div><strong>WhatsApp Accounts:</strong> {p.waba_limit}</div>
                </div>

                <div className="pt-2 space-y-1 text-xs text-slate-600">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3.5 h-3.5 text-brand-600" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setEditingPlan({ ...p })}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Configure Plan</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Configure Plan: {editingPlan.name}</h3>
                <p className="text-xs text-slate-500">{editingPlan.slug}</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Display Name</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingPlan.monthly_price_usd}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price_usd: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Yearly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingPlan.yearly_price_usd}
                    onChange={(e) => setEditingPlan({ ...editingPlan, yearly_price_usd: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Limit</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.contact_limit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, contact_limit: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Team Member Limit</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.team_member_limit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, team_member_limit: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm"
                >
                  {saveLoading ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

