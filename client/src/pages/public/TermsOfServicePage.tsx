import React from 'react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Terms & Conditions
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Terms of Service & Acceptable Use</h1>
        <p className="text-xs text-slate-500">Effective Date: November 2026 &bull; Version 2.0</p>
      </div>

      <div className="prose prose-slate text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By registering for an account, submitting an onboarding application, or using MetaGreenWave ("Service"), you agree to be legally bound by these Terms of Service, our Privacy Policy, and all applicable Meta WhatsApp Business Policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Customer Application & Platform Approval</h2>
          <p>
            Access to live WhatsApp messaging capabilities requires formal approval by MetaGreenWave Super Admin. MetaGreenWave reserves the right to approve, reject, or suspend any application or workspace that fails to satisfy business verification, carrier compliance, or acceptable use guidelines.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Meta Platform & Policy Adherence</h2>
          <p>
            MetaGreenWave provides direct connectivity to the official Meta WhatsApp Cloud API. Customers must strictly adhere to the official WhatsApp Business Messaging Policy and WhatsApp Commerce Policy. Prohibited messaging includes, without limitation: unauthorized spam, un-consented promotional broadcasts, illegal gambling, counterfeit goods, and deceptive marketing.
          </p>
          <p>
            MetaGreenWave does not guarantee approval of message templates submitted to Meta, as template review is performed solely by Meta Platforms, Inc.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Subscriptions, Fees & Rate Cards</h2>
          <p>
            MetaGreenWave workspace subscriptions cover platform software features (e.g. Chatbot Studio, Shared Inbox, CRM, Automations). WhatsApp conversation delivery fees are billed separately according to published, country-specific Meta rate cards. All usage fees are debited from the Customer's wallet balance in real time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">5. Suspension & Termination</h2>
          <p>
            MetaGreenWave reserves the immediate right to suspend or terminate any account that incurs excessive spam complaints, violates opt-out suppression rules, or experiences quality rating degradation by Meta (flagged RED tier).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">6. Limitation of Liability</h2>
          <p>
            MetaGreenWave is provided on an "as is" and "as available" basis. In no event shall MetaGreenWave be liable for indirect, incidental, or consequential damages resulting from carrier network outages, Meta API maintenance, or template rejections by Meta.
          </p>
        </section>
      </div>
    </div>
  );
};

