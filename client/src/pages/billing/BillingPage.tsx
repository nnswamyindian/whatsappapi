import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Wallet,
  Check,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  Download,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { activeOrg, refreshOrg } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Billing cycle toggle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Checkout modal
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'bank_transfer'>('card');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  // Top up state
  const [topupAmount, setTopupAmount] = useState('50');
  const [toppingUp, setToppingUp] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const fetchData = () => {
    Promise.all([
      api.get('/billing/subscription'),
      api.get('/billing/plans'),
      api.get('/billing/invoices'),
      api.get('/billing/overview'),
      api.get('/billing/ledger'),
    ])
      .then(([sub, pl, inv, ov, ld]) => {
        setSubscriptionData(sub);
        setPlans(pl);
        setInvoices(inv);
        setOverview(ov);
        setLedger(ld);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [activeOrg?.id]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;
    setSubmittingCheckout(true);

    try {
      const res = await api.post('/billing/checkout', {
        planId: selectedPlanForCheckout.id,
        billingCycle,
        paymentMethod,
      });

      setSelectedPlanForCheckout(null);
      await refreshOrg();
      fetchData();
      alert(`🎉 ${res.message}\nYour payment was captured and an omnichannel WhatsApp receipt has been dispatched!`);
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const handleRenew = async () => {
    if (!confirm('Proceed to renew your current subscription for another billing cycle?')) return;
    setRenewing(true);

    try {
      const res = await api.post('/billing/renew', {});
      await refreshOrg();
      fetchData();
      alert(`🎉 ${res.message}\nPayment captured and confirmation dispatched via WhatsApp.`);
    } catch (err: any) {
      alert(err.message || 'Renewal failed');
    } finally {
      setRenewing(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setToppingUp(true);
    try {
      await api.post('/billing/topup', { amountUsd: parseFloat(topupAmount) });
      await refreshOrg();
      fetchData();
      alert(`Successfully added $${topupAmount} to prepaid messaging wallet!`);
    } catch (err: any) {
      alert(err.message || 'Top-up failed');
    } finally {
      setToppingUp(false);
    }
  };

  const sub = subscriptionData?.subscription;
  const quotas = subscriptionData?.quotas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <span>Subscription & Billing Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your MetaGreenWave business tier, quota entitlements, and view payment statements.
          </p>
        </div>

        {sub && (
          <button
            onClick={handleRenew}
            disabled={renewing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${renewing ? 'animate-spin' : ''}`} />
            <span>{renewing ? 'Renewing...' : '1-Click Renew Subscription'}</span>
          </button>
        )}
      </div>

      {/* Active Subscription Status & Quota Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Plan Card */}
        <div className="bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-slate-800">
          <div>
            <div className="flex items-center justify-between">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                {sub?.status || 'Active Plan'}
              </span>
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>

            <h2 className="text-2xl font-black mt-4 tracking-tight">
              {sub?.planName || `${activeOrg?.plan_tier?.toUpperCase() || 'STARTER'} PLAN`}
            </h2>

            <div className="text-xs text-slate-300 mt-1">
              Billing Cycle: <strong className="text-white capitalize">{sub?.billingCycle || 'monthly'}</strong>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Next Renewal:
                </span>
                <span className="font-bold text-white">
                  {sub?.renewalDate ? new Date(sub.renewalDate).toLocaleDateString() : 'Continuous'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" /> Time Remaining:
                </span>
                <span className="font-bold text-amber-300">
                  {sub?.daysRemaining !== undefined ? `${sub.daysRemaining} days left` : '30 days left'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Meta Cloud API v21.0 integration active</span>
          </div>
        </div>

        {/* Quota Entitlements Progress */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Current Workspace Quota Entitlements</h2>
            <p className="text-xs text-slate-500 mb-5">
              Live consumption against your active MetaGreenWave plan limits. Upgrades apply instantly.
            </p>

            <div className="space-y-4">
              {/* Contacts Quota */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Audience Contacts</span>
                  <span>
                    <strong>{quotas?.contacts?.used || 0}</strong> / {quotas?.contacts?.limit || 1000} contacts ({quotas?.contacts?.percentage || 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${quotas?.contacts?.percentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Monthly Campaigns */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Broadcast Campaigns</span>
                  <span>
                    <strong>{quotas?.campaigns?.used || 0}</strong> / {quotas?.campaigns?.limit || 50} campaigns ({quotas?.campaigns?.percentage || 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${quotas?.campaigns?.percentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Team Members */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Team Seats (RBAC)</span>
                  <span>
                    <strong>{quotas?.teamMembers?.used || 0}</strong> / {quotas?.teamMembers?.limit || 3} seats ({quotas?.teamMembers?.percentage || 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${quotas?.teamMembers?.percentage || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-emerald-900 font-medium">
              Need higher audience capacity or dedicated IP bandwidth?
            </span>
            <span className="font-extrabold text-brand-700">Choose a higher tier below ↓</span>
          </div>
        </div>
      </div>

      {/* Available Plans & 1-Click Upgrade Picker */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Available Subscription Tiers</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a tier to scale your campaigns, visual chatbot automations, and team capacity.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl text-xs font-bold self-start">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <span>Annual Billing</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = activeOrg?.plan_tier === p.slug;
            const price = billingCycle === 'yearly' ? p.yearly_price_usd : p.monthly_price_usd;

            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50/20 ring-2 ring-brand-200 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-900">{p.name}</span>
                    {isCurrent && (
                      <span className="bg-brand-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        Current Tier
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 min-h-8 mb-4">{p.description}</p>

                  <div className="text-3xl font-black text-slate-900 mb-6">
                    ${price}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-100 mb-6">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Check className="w-4 h-4 text-brand-600" />
                      <span>{p.contact_limit.toLocaleString()} Audience Contacts</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Check className="w-4 h-4 text-brand-600" />
                      <span>{p.team_member_limit} Team Member Seats</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Check className="w-4 h-4 text-brand-600" />
                      <span>{p.campaign_limit} Broadcast Campaigns/mo</span>
                    </div>
                    {p.features?.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlanForCheckout(p)}
                  className={`w-full py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-xs ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20'
                  }`}
                >
                  {isCurrent ? 'Switch Billing Cycle / Renew' : `Upgrade to ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prepaid Messaging Wallet & Top-Up */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-brand-900 via-brand-800 to-emerald-700 text-white p-6 rounded-3xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-100 text-xs font-semibold">Prepaid Messaging Wallet</span>
              <Wallet className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="text-3xl font-extrabold mt-3 tracking-tight">
              ${(overview?.walletBalance || 0).toFixed(2)}
            </div>
            <div className="text-xs text-emerald-200 mt-1">
              Low-balance threshold: ${overview?.lowBalanceThreshold || 10}
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-600/60 mt-4 text-[11px] text-emerald-200">
            Deducted automatically as Meta Cloud API conversation charges occur.
          </div>
        </div>

        {/* Top-Up Box */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h2 className="font-bold text-sm text-slate-900 mb-1">Replenish Prepaid Messaging Balance</h2>
          <p className="text-xs text-slate-500 mb-4">
            Prepay for high-volume WhatsApp broadcasts. Never get throttled during festival campaigns.
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
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-bold text-slate-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={toppingUp}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 shrink-0"
              >
                {toppingUp ? 'Adding...' : `Add +$${topupAmount}.00 to Balance`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Official Invoices & Receipts */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Official Invoices & Tax Receipts</span>
            </h2>
            <p className="text-xs text-slate-500">Download and print receipts for your business records.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-slate-900">{inv.invoice_number}</td>
                    <td className="p-3.5">{inv.billing_reason}</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      ${Number(inv.amount).toFixed(2)} {inv.currency}
                    </td>
                    <td className="p-3.5">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1 rounded-lg border border-brand-200"
                      >
                        <Download className="w-3 h-3" /> View / Print
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Checkout Modal */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Upgrade to {selectedPlanForCheckout.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Billing Cycle: <strong className="capitalize">{billingCycle}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{selectedPlanForCheckout.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Includes {selectedPlanForCheckout.contact_limit.toLocaleString()} contacts & {selectedPlanForCheckout.team_member_limit} seats
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-slate-900">
                    ${billingCycle === 'yearly' ? selectedPlanForCheckout.yearly_price_usd : selectedPlanForCheckout.monthly_price_usd}
                  </div>
                  <div className="text-[10px] text-slate-400">Total Due Today</div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', label: 'Credit Card' },
                    { id: 'upi', label: 'UPI / QR' },
                    { id: 'bank_transfer', label: 'NetBanking' },
                  ].map((pm) => (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        paymentMethod === pm.id
                          ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-200'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-[11px] text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Immediate activation: Instant WhatsApp payment confirmation and automated marketing guidance playbooks sent directly to your phone.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlanForCheckout(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckout}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submittingCheckout ? 'Authorizing & Capturing...' : 'Confirm & Activate Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
