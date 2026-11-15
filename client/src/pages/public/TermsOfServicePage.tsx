import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, AlertCircle, FileText } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Terms & Conditions
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-500">Effective Date: November 2026 &bull; Version 2.0</p>
      </div>

      <div className="prose prose-slate text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By registering for an account, accessing the dashboard, or utilizing the <strong>MetaGreenWave</strong> platform, you enter into a legally binding agreement with <strong>Digi8 Solutions</strong> ("we", "us", "our"). These Terms of Service, along with our <Link to="/privacy-policy" className="text-brand-600 underline">Privacy Policy</Link>, <Link to="/acceptable-use" className="text-brand-600 underline">Acceptable Use Policy</Link>, and <Link to="/cancellation-refund" className="text-brand-600 underline">Cancellation & Refund Policy</Link>, govern your use of the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Customer Application & Compliance Verification</h2>
          <p>
            Access to live WhatsApp messaging capabilities requires formal verification and approval by Digi8 Solutions platform administrators. We reserve the right to approve, reject, or request additional information for any application that does not satisfy business legitimacy criteria, carrier requirements, or acceptable use guidelines.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Meta Platform & Policy Adherence</h2>
          <p>
            MetaGreenWave integrates directly with the official Meta WhatsApp Business Platform Cloud API. Customers must strictly comply with all Meta policies, including the WhatsApp Business Messaging Policy and WhatsApp Commerce Policy.
          </p>
          <p>
            You acknowledge that Meta Platforms, Inc. maintains independent discretion over template approvals, phone number quality ratings, and messaging limit tiers. Digi8 Solutions does not represent or guarantee approval of custom templates submitted to Meta.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Opt-In & Anti-Spam Requirements</h2>
          <p>
            You agree to send messages only to recipients who have given clear, auditable opt-in consent to receive communications from your business. The dispatch of unsolicited broadcast messages, cold outreach, or spam is strictly prohibited and constitutes grounds for immediate workspace termination without refund.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">5. Subscriptions, Fees & Rate Cards</h2>
          <p>
            Workspace subscriptions cover software access, inbox management, chatbot workflows, and automation features. WhatsApp conversation delivery fees are billed separately according to published Meta country-specific conversation rate cards and debited directly from your prepaid wallet in real time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">6. Suspension & Termination</h2>
          <p>
            Digi8 Solutions reserves the right to suspend or terminate service to any account that incurs excessive recipient spam complaints, violates opt-out suppression rules, or experiences quality rating degradation by Meta (flagged RED tier).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">7. Disclaimer of Endorsement</h2>
          <p>
            MetaGreenWave by Digi8 Solutions is an independent software application that integrates with the official WhatsApp Business Platform Cloud API provided by Meta Platforms, Inc. Neither MetaGreenWave nor Digi8 Solutions claims official partnership, sponsorship, or Tech Provider / BSP status from Meta Platforms, Inc. unless officially conferred.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">8. Limitation of Liability</h2>
          <p>
            MetaGreenWave is provided on an "as is" and "as available" basis. To the maximum extent permitted by applicable law, Digi8 Solutions shall not be liable for indirect, incidental, or consequential damages resulting from upstream Meta API downtime, carrier network delivery delays, or template rejections.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">9. Contact Information</h2>
          <p>
            For legal inquiries, contract notices, or questions regarding these Terms, please contact:
            <br />
            <strong>Digi8 Solutions &mdash; Legal & Compliance</strong>
            <br />
            Email: <a href="mailto:hello@digi8solutions.com" className="text-brand-600 underline font-semibold">hello@digi8solutions.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};
