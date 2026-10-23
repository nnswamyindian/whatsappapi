import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Wallet, ArrowDownRight, ArrowUpRight, ShieldCheck, Check } from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { activeOrg, refreshOrg } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [rateCard, setRateCard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Top up state
  const [topupAmount, setTopupAmount] = useState('50');
  const [toppingUp, setToppingUp] = useState(false);

  const fetchData = () => {
    Promise.all([
      api.get('/billing/overview'),
      api.get('/billing/ledger'),
      api.get('/billing/rate-card'),
    ])
      .then(([ov, ld, rc]) => {
        setOverview(ov);
        setLedger(ld);
        setRateCard(rc);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [activeOrg?.id]);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setToppingUp(true);
    try {
      await api.post('/billing/topup', { amountUsd: parseFloat(topupAmount) });
      await refreshOrg();
      fetchData();
      alert(`Successfully added $${topupAmount} to prepaid wallet!`);
    } catch (err: any) {
      alert(err.message || 'Top-up failed');
    } finally {
      setToppingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <span>Billing, Subscriptions & Usage Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of platform subscription, Meta conversation charges, and prepaid credits
          </p>
        </div>
      </div>

      {/* Wallet Balance & Quick Top-Up Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-brand-900 via-brand-800 to-emerald-700 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-100 text-xs font-semibold">Prepaid Messaging Wallet</span>
              <Wallet className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="text-3xl font-extrabold mt-3 tracking-tight">
              ${(overview?.walletBalance || 0).toFixed(2)}
            </div>
            <div className="text-xs text-emerald-200 mt-1">
              Low-balance alert threshold: ${overview?.lowBalanceThreshold || 10}
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-600/60 mt-4 text-[11px] text-emerald-200">
            Deducted automatically as campaigns and transactional messages are dispatched.
          </div>
        </div>

        {/* Top-Up Box */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="font-bold text-sm text-slate-900 mb-2">Replenish Prepaid Messaging Credits</h2>
          <p className="text-xs text-slate-500 mb-4">
            Prepay for high-throughput WhatsApp marketing campaigns. Never run out of messaging quota.
          </p>

          <form onSubmit={handleTopup} className="space-y-3">
            <div className="flex gap-2">
              {['25', '50', '100', '250'].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setTopupAmount(amt)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    topupAmount === amt
                      ? 'bg-brand-50 border-brand-500 text-brand-900 ring-2 ring-brand-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="5"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold text-slate-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={toppingUp}
                className="px-6 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 shrink-0"
              >
                {toppingUp ? 'Adding...' : `Add +$${topupAmount}.00 to Wallet`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Subscription Plans Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="font-bold text-sm text-slate-900">Platform Subscription Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              tier: 'starter',
              name: 'Starter Plan',
              price: '$29/mo',
              features: ['1 Phone Number', 'Up to 3 Agents', 'Standard WhatsApp Rate', 'Full Contact Manager'],
            },
            {
              tier: 'growth',
              name: 'Growth Business',
              price: '$79/mo',
              popular: true,
              features: ['3 Phone Numbers', 'Up to 10 Agents', 'Automations & Flow Builder', 'Priority Meta Webhook Processing'],
            },
            {
              tier: 'enterprise',
              name: 'Enterprise Dedicated',
              price: '$249/mo',
              features: ['10+ Phone Numbers', '50 Agents & Custom Roles', 'Dedicated High-Throughput Queue', 'Custom SLA & Account Manager'],
            },
          ].map((plan) => {
            const isCurrent = overview?.planTier === plan.tier;
            return (
              <div
                key={plan.tier}
                className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50/30 ring-2 ring-brand-200'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-slate-900">{plan.name}</span>
                    {isCurrent && (
                      <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 mb-3">{plan.price}</div>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Effective-Dated Rate Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Configured Rate Card (Per Conversation)</h2>
          <span className="text-[11px] text-slate-400">Effective from 2025-01-01</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Meta Provider Rate (USD)</th>
                <th className="px-4 py-3">Platform Fee (USD)</th>
                <th className="px-4 py-3">Total Rate Per Conversation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {rateCard.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 font-medium">
                  <td className="px-4 py-3 font-bold font-sans">{r.country_code}</td>
                  <td className="px-4 py-3 font-sans font-semibold">{r.category}</td>
                  <td className="px-4 py-3">${r.provider_rate_usd.toFixed(4)}</td>
                  <td className="px-4 py-3 text-emerald-700">${r.platform_fee_usd.toFixed(4)}</td>
                  <td className="px-4 py-3 font-bold text-brand-900">
                    ${(r.provider_rate_usd + r.platform_fee_usd).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Transaction & Usage Ledger</h2>
          <span className="text-[11px] text-slate-400">Auditable Balance Deductions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount (USD)</th>
                <th className="px-4 py-3">Balance After</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {ledger.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{l.description}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                      {l.transaction_type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-mono font-bold ${l.amount >= 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {l.amount >= 0 ? `+$${l.amount.toFixed(2)}` : `-$${Math.abs(l.amount).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">${l.balance_after.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
