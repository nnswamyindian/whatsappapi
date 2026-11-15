import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Ban } from 'lucide-react';

export const AcceptableUsePage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          Compliance & Anti-Spam Policy
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Acceptable Use Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: November 2026 &bull; Version 2.0</p>
      </div>

      <div className="prose prose-slate text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Overview & Policy Objective</h2>
          <p>
            <strong>MetaGreenWave</strong>, operated by <strong>Digi8 Solutions</strong>, is an enterprise WhatsApp Business Messaging SaaS platform built exclusively on official Meta Cloud API infrastructure. We enforce a zero-tolerance policy against spam, harassment, and unauthorized messaging to protect recipients, maintain platform integrity, and preserve high WhatsApp sender quality ratings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Mandatory Recipient Opt-In</h2>
          <p>
            You may only dispatch WhatsApp messages to individuals who have given you explicit, prior, verifiable consent to receive communication from your specific business via WhatsApp.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Purchased, rented, scraped, or third-party lead lists are strictly prohibited.</li>
            <li>Opt-in consent must be specific to the categories of messages sent (e.g. transactional alerts vs. promotional campaigns).</li>
            <li>You must maintain auditable timestamped records of recipient consent.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Prohibited Content & Industries</h2>
          <p>
            In strict alignment with the Meta WhatsApp Commerce Policy and WhatsApp Business Messaging Policy, the following content and business models are prohibited:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 flex items-start gap-2.5">
              <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-semibold">Unsolicited Mass Spam</strong>
                Sending bulk messages to unknown recipients or automated blasting.
              </div>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 flex items-start gap-2.5">
              <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-semibold">Gambling & Lotteries</strong>
                Online casinos, sports betting, real-money gaming, or unauthorized prize draws.
              </div>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 flex items-start gap-2.5">
              <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-semibold">Deceptive & Fraudulent Schemes</strong>
                Phishing, get-rich-quick programs, unauthorized cryptocurrency promotion, or multi-level marketing.
              </div>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 flex items-start gap-2.5">
              <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-semibold">Regulated Goods</strong>
                Weapons, munitions, tobacco, alcohol, prescription pharmaceuticals, or counterfeit goods.
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Immediate Opt-Out & Blacklist Honoring</h2>
          <p>
            Every promotional message must offer an intuitive opt-out path. If a recipient replies with words such as "STOP", "CANCEL", or "UNSUBSCRIBE", MetaGreenWave automatically places their phone number on the organization's suppression blacklist. Attempting to bypass or clear this blacklist to re-message opted-out recipients will result in immediate workspace termination.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">5. Sender Quality Monitoring & Enforcement</h2>
          <p>
            Meta continuously monitors your phone number quality rating (GREEN, YELLOW, RED). If your phone number degrades to RED status due to excessive recipient blocks or spam reports, MetaGreenWave reserves the right to pause campaign dispatching immediately to protect your WABA and our platform reputation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">6. Reporting Abuse</h2>
          <p>
            To report spam, phishing, or policy violations originating from a MetaGreenWave user, please contact:
            <br />
            <strong>Digi8 Solutions Abuse & Trust Team</strong>
            <br />
            Email: <a href="mailto:hello@digi8solutions.com" className="text-brand-600 underline font-semibold">hello@digi8solutions.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};
