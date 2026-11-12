import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, HelpCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="py-16 md:py-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Transparent Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Simple Subscription. Transparent Usage.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          No hidden per-contact markups, no artificial message tier restrictions, and no misleading "unlimited" promises.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 bg-brand-600 rounded-full p-1 transition-colors relative"
            aria-label="Toggle billing cycle"
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
            <span>Annual Billing</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Starter Plan */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">
                ${billingCycle === 'monthly' ? '29' : '24'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">/ month</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Essential broadcast campaigns and shared inbox for growing local businesses.
            </p>
            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900"><Check className="w-4 h-4 text-brand-600" /> 1,000 Contacts Limit</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 2 Team Members</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 50 Broadcast Campaigns / mo</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 1 Connected WhatsApp Number</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Shared Inbox (24h Window Timer)</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Standard Template Builder</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Email & Ticket Support</div>
            </div>
          </div>
          <Link
            to="/register?plan=starter"
            className="w-full text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-sm transition-all"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Growth Plan */}
        <div className="bg-white rounded-3xl p-8 border-2 border-brand-600 shadow-xl relative ring-4 ring-brand-600/10 space-y-6 flex flex-col justify-between">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            Recommended
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Growth</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">
                ${billingCycle === 'monthly' ? '79' : '65'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">/ month</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete automated toolkit with visual chatbot studio, CRM pipeline, and transactional API.
            </p>
            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900"><Check className="w-4 h-4 text-brand-600" /> 10,000 Contacts Limit</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 10 Team Members</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Unlimited Broadcast Campaigns</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 2 Connected WhatsApp Numbers</div>
              <div className="flex items-center gap-2 font-semibold text-brand-900"><Check className="w-4 h-4 text-brand-600" /> Drag-and-Drop Chatbot Studio</div>
              <div className="flex items-center gap-2 font-semibold text-brand-900"><Check className="w-4 h-4 text-brand-600" /> WhatsApp Sales CRM Pipeline</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> No-Code Workflow Automations</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Server-to-Server Transactional API & OTP</div>
            </div>
          </div>
          <Link
            to="/register?plan=growth"
            className="w-full text-center py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
          >
            Start Growth Plan
          </Link>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enterprise</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">
                ${billingCycle === 'monthly' ? '199' : '165'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">/ month</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dedicated high-volume infrastructure with custom RBAC, audit exports, and SLA.
            </p>
            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900"><Check className="w-4 h-4 text-brand-600" /> 100,000 Contacts Limit</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 50 Team Members</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 5 Connected WhatsApp Numbers</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Custom Roles & Permissions (RBAC)</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Security Audit Log Export</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Priority Meta Cloud API Routing</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Dedicated Technical Account Manager</div>
            </div>
          </div>
          <Link
            to="/register?plan=enterprise"
            className="w-full text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-sm transition-all"
          >
            Contact Sales
          </Link>
        </div>
      </div>

      {/* Meta Messaging Breakdown */}
      <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200 space-y-6">
        <div className="max-w-2xl space-y-2">
          <h3 className="text-xl font-extrabold text-slate-900">
            How Meta's Official Conversation Pricing Works
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            WhatsApp conversations are billed directly per 24-hour window by Meta based on recipient country and conversation category. MetaGreenWave reconciles these transparently with zero hidden markups.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">India (IN)</th>
                <th className="p-3.5">United States (US)</th>
                <th className="p-3.5">UK (GB)</th>
                <th className="p-3.5">Rest of World</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-3.5 font-bold text-slate-900">Utility</td>
                <td className="p-3.5">Order confirmations, billing statements, account updates</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0018</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0150</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0200</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0200</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-900">Authentication</td>
                <td className="p-3.5">Single-use cryptographic login OTPs and verification</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0018</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0135</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0180</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0180</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-900">Marketing</td>
                <td className="p-3.5">Promotions, discounts, product launches, newsletters</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0099</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0250</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0350</td>
                <td className="p-3.5 font-semibold text-brand-800">$0.0350</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-900">Service (Customer Care)</td>
                <td className="p-3.5">User-initiated inbound customer support queries</td>
                <td className="p-3.5 font-semibold text-emerald-700">Free in 24h window</td>
                <td className="p-3.5 font-semibold text-emerald-700">Free in 24h window</td>
                <td className="p-3.5 font-semibold text-emerald-700">Free in 24h window</td>
                <td className="p-3.5 font-semibold text-emerald-700">Free in 24h window</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

