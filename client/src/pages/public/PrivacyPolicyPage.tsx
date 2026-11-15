import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Database, Trash2 } from 'lucide-react';

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
          <h2 className="text-lg font-bold text-slate-900">1. Overview & Operating Entity</h2>
          <p>
            This Privacy Policy governs the collection, processing, and protection of personal data by <strong>Digi8 Solutions</strong> ("we", "us", "our"), operating the WhatsApp Business messaging SaaS platform <strong>MetaGreenWave</strong> (accessible at metagreenwave.com).
          </p>
          <p>
            MetaGreenWave facilitates communications between business subscribers ("Customers") and their end-user recipients ("Recipients") via the official Meta WhatsApp Cloud API. We are committed to strict compliance with the Digital Personal Data Protection Act (DPDPA 2023), the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and Meta Platform Policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">2. Roles: Data Controller vs. Data Processor</h2>
          <p>
            <strong>Customer Account Data (Data Controller):</strong> When you register for an account, subscribe to a plan, or contact our support team, Digi8 Solutions acts as a Data Controller for your administrative profile (name, business email, business category, encrypted credentials, and billing records).
          </p>
          <p>
            <strong>Customer Messaging & Contact Data (Data Processor):</strong> When you upload recipient lists, create audience segments, or dispatch WhatsApp templates, Digi8 Solutions acts strictly as a Data Processor on your behalf. You (the Customer) remain the Data Controller responsible for securing valid, verifiable consent from your recipients.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">3. Data We Process</h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>Recipient Identifiers:</strong> Recipient phone numbers normalized strictly into international E.164 format.</li>
            <li><strong>Messaging Metadata:</strong> Template names, parameters, delivery timestamps, read status receipts, and incoming chat text.</li>
            <li><strong>Meta Graph API Credentials:</strong> WABA ID, Phone Number ID, and System User Access Tokens (all stored cryptographically encrypted using AES-256-GCM).</li>
            <li><strong>Audit & Consent Records:</strong> Timestamp, policy version, and IP address recorded when accepting platform terms.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">4. Cryptographic Security & Credential Protection</h2>
          <p>
            All WhatsApp access tokens, webhook verify tokens, and API keys are protected at rest with authenticated <strong>AES-256-GCM</strong> encryption. Encryption keys reside in secure server environments and are never transmitted to browser clients.
          </p>
          <p>
            One-Time Passwords (OTPs) and account passwords are encrypted using salted SHA-256 or PBKDF2 hashes. We never store plain text passwords or raw OTP codes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">5. Multi-Tenant Customer Isolation</h2>
          <p>
            Every customer workspace is strictly isolated. All relational database queries, contact books, message logs, and audience filters enforce tenant boundaries via <code>organization_id</code> at both the routing and data layers. No customer can access or inspect another workspace's data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">6. Recipient Opt-Out & Suppression Enforcement</h2>
          <p>
            Recipients maintain the fundamental right to revoke messaging consent. When a recipient responds with standard opt-out keywords ("STOP", "UNSUBSCRIBE", "CANCEL"), our automated engine places their phone number on the organization's suppression blacklist, preventing any future broadcast deliveries.
          </p>
        </section>

        <section className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <span>7. User Data Deletion Rights & Portal</span>
          </h2>
          <p>
            Under DPDPA, GDPR, and Meta Platform Policies, you have the right to request erasure of your personal data, customer contacts, and connected WhatsApp credentials at any time.
          </p>
          <p>
            We provide a dedicated, public Data Deletion Portal with real-time status tracking and support for automated Meta signed requests:
          </p>
          <div className="pt-2">
            <Link
              to="/data-deletion"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
            >
              <span>Access Data Deletion Instructions & Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">8. Data Retention Policy</h2>
          <p>
            Message logs and delivery receipts are retained for operational verification and billing audit purposes for 180 days, after which they are systematically archived or purged. Webhook event deduplication records are purged after 14 days. Workspace account data is retained for the active lifecycle of your subscription.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">9. Contact & Data Protection Officer</h2>
          <p>
            For privacy inquiries, regulatory compliance requests, or data deletion queries, please contact Digi8 Solutions at:
            <br />
            <strong>Digi8 Solutions &mdash; MetaGreenWave Data Protection Office</strong>
            <br />
            Email: <a href="mailto:hello@digi8solutions.com" className="text-brand-600 underline font-semibold">hello@digi8solutions.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};
