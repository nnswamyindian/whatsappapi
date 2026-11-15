import React from 'react';
import { CreditCard, RefreshCw, AlertCircle } from 'lucide-react';

export const RefundCancellationPage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Billing & Commercial Terms
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Cancellation & Refund Policy
        </h1>
        <p className="text-xs text-slate-500">Effective Date: November 2026 &bull; Version 2.0</p>
      </div>

      <div className="prose prose-slate text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Overview</h2>
          <p>
            This Cancellation and Refund Policy governs your subscription and prepaid wallet transactions for <strong>MetaGreenWave</strong>, operated by <strong>Digi8 Solutions</strong>. We are committed to complete billing transparency and fair commercial practices.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Software Subscription Plans (Monthly & Annual)</h2>
          <p>
            MetaGreenWave offers tiered SaaS plans (e.g. Starter, Growth, Enterprise) providing access to our campaign engine, shared team inbox, chatbot studio, and automations.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>Cancellation:</strong> You may cancel your subscription at any time via Dashboard &gt; Billing or by emailing <a href="mailto:hello@digi8solutions.com" className="text-brand-600 underline">hello@digi8solutions.com</a>.</li>
            <li><strong>Term Duration:</strong> When you cancel, your account remains active with full platform features until the end of the prepaid billing cycle. No further recurring charges will occur.</li>
            <li><strong>Refunds:</strong> Subscription fees are generally non-refundable once the billing period has commenced. In cases of demonstrated technical service failure exceeding 48 consecutive hours attributable solely to our platform, prorated refunds may be issued upon request.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Prepaid Messaging Wallet Balances</h2>
          <p>
            Customers maintain a prepaid wallet to cover Meta WhatsApp conversation charges.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>Unused Balance:</strong> If you decide to close your account and disconnect your WhatsApp Business Account, any remaining, unspent prepaid wallet balance can be refunded to your original payment method.</li>
            <li><strong>Processing:</strong> Refund requests for unused wallet funds must be submitted in writing to <code>hello@digi8solutions.com</code>. Refunds are processed within 7 to 10 business days, less applicable payment gateway handling fees.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Meta Conversation Fees (Non-Refundable)</h2>
          <p>
            Fees billed for completed or delivered WhatsApp conversations (Marketing, Utility, Authentication, Service) are direct pass-through costs levied by Meta Platforms, Inc. Once a message is transmitted through the Meta Cloud API and billed against your wallet, these network fees cannot be refunded or revoked.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">5. Billing Inquiries & Dispute Resolution</h2>
          <p>
            If you believe an erroneous charge has occurred, please notify our billing department within 14 days of the transaction:
            <br />
            <strong>Digi8 Solutions &mdash; Billing Support</strong>
            <br />
            Email: <a href="mailto:hello@digi8solutions.com" className="text-brand-600 underline font-semibold">hello@digi8solutions.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};
