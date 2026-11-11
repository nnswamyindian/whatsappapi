import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Legal & Compliance
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: November 2026 &bull; Version 2.0</p>
      </div>

      <div className="prose prose-slate text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">1. Overview & Scope</h2>
          <p>
            GreenWave Technologies ("GreenWave", "we", "us", "our") provides a multi-tenant business messaging software platform that facilitates communication between business subscribers ("Customers") and their end-user recipients ("Recipients") via the official Meta WhatsApp Cloud API. This Privacy Policy details our practices concerning data collection, encryption, tenant isolation, and regulatory compliance under GDPR, CCPA, and Meta Platform Policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Data We Collect as a Processor</h2>
          <p>
            In our capacity as a data processor on behalf of our Customers, we store customer phone numbers (normalized strictly to E.164 format), message bodies, template parameters, delivery and read timestamps, and customer service conversation transcripts.
          </p>
          <p>
            We require all Customers to record explicit, auditable opt-in consent for all Recipients prior to uploading contact files or dispatching broadcast messaging.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Encryption & Credential Protection at Rest</h2>
          <p>
            Meta Cloud API System User access tokens, app secrets, and webhook secrets are cryptographically encrypted at rest using AES-256-GCM authenticated encryption. Encryption keys are securely managed server-side and never exposed to browser clients or logged in plain text.
          </p>
          <p>
            One-Time Passwords (OTPs) generated via our Transactional API are never stored in plain text; they are hashed using SHA-256 with salt and purged immediately upon expiration or verification.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Suppression & Opt-Out Blacklist Enforcement</h2>
          <p>
            Recipients retain the absolute right to opt out of promotional messages. When a recipient replies with keywords such as "STOP" or "UNSUBSCRIBE", our automated reply engine immediately enters their phone number into the Customer's suppression blacklist, preventing any future broadcast deliveries.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">5. Multi-Tenant Scoping & Data Retention</h2>
          <p>
            Every database query is strictly scoped by <code>organization_id</code>. Customers are strictly isolated from one another. Customers may request complete deletion of their workspace data, contacts, and message logs at any time by contacting our compliance officer at <code>privacy@greenwave.io</code>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">6. Contact Information</h2>
          <p>
            For privacy inquiries, GDPR data subject access requests, or compliance questions, please contact:
            <br />
            <strong>GreenWave Compliance & Data Protection Office</strong>
            <br />
            Email: <code>privacy@greenwave.io</code>
          </p>
        </section>
      </div>
    </div>
  );
};

