import React from 'react';
import { Cookie, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Compliance & Transparency
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Cookie Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: November 2026 &bull; Version 2.0</p>
      </div>

      <div className="prose prose-slate text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Introduction</h2>
          <p>
            This Cookie Policy explains how <strong>Digi8 Solutions</strong> ("we", "us", "our") uses cookies and similar storage technologies on our business messaging platform, <strong>MetaGreenWave</strong> (accessible at metagreenwave.com).
          </p>
          <p>
            We prioritize user privacy and data minimization. We do not use third-party cross-site advertising trackers, behavioral profiling cookies, or data-brokering mechanisms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Categories of Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Key / Purpose</th>
                  <th className="p-3">Lifespan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Strictly Necessary</td>
                  <td className="p-3">
                    <code>gw_token</code>, <code>gw_active_org_id</code> &mdash; Authenticates your session and associates your actions with your active organization.
                  </td>
                  <td className="p-3 text-slate-500">Session / 7 Days</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Security & Anti-CSRF</td>
                  <td className="p-3">
                    Cryptographic tokens ensuring requests originate from verified browser sessions and preventing cross-site forgery.
                  </td>
                  <td className="p-3 text-slate-500">Session</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">User Interface State</td>
                  <td className="p-3">
                    Remembers navigation sidebar collapse state and theme preferences locally on your device.
                  </td>
                  <td className="p-3 text-slate-500">Persistent (Local Storage)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Third-Party Integrations & Meta SDK</h2>
          <p>
            When you initiate Meta WhatsApp Embedded Signup, the official Facebook JavaScript SDK (<code>connect.facebook.net/en_US/sdk.js</code>) is loaded securely into your browser. Meta Platforms, Inc. may set cookies necessary to authenticate your Facebook Business login credentials. We do not receive, store, or inspect your personal Facebook login cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Managing & Disabling Cookies</h2>
          <p>
            You can modify your browser settings to refuse or delete cookies at any time. However, please note that disabling strictly necessary cookies will prevent you from signing in to the MetaGreenWave dashboard.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">5. Inquiries & Contact</h2>
          <p>
            If you have questions regarding our cookie practices, please contact Digi8 Solutions at:
            <br />
            <strong>Digi8 Solutions &mdash; MetaGreenWave Compliance Team</strong>
            <br />
            Email: <a href="mailto:hello@digi8solutions.com" className="text-brand-600 underline font-semibold">hello@digi8solutions.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};
