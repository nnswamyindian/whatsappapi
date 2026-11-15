import React from 'react';
import { ShieldCheck, Lock, Database, KeyRound, Server, FileCheck, CheckCircle2 } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Enterprise Trust Center
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Security, Architecture & Data Protection
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          How <strong>MetaGreenWave by Digi8 Solutions</strong> protects your WhatsApp Business credentials, customer conversations, and tenant privacy.
        </p>
      </div>

      {/* Grid of Security Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Cryptographic Encryption at Rest</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Meta System User tokens, app secrets, and webhook tokens are never stored in plaintext. They are encrypted using authenticated <strong>AES-256-GCM</strong> with unique initialization vectors (IV) and authentication tags. Encryption keys are securely managed server-side and never exposed to the frontend.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Strict Multi-Tenant Isolation</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            MetaGreenWave operates on a shared-process, logically partitioned enterprise MySQL architecture. Every database query, contact retrieval, template listing, and message dispatch is rigorously scoped by <code>organization_id</code> at the middleware and database layers.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">HMAC-SHA256 Webhook Verification</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            All inbound Meta webhooks are cryptographically authenticated against your configured App Secret using <code>X-Hub-Signature-256</code> with timing-safe comparisons (<code>crypto.timingSafeEqual</code>). Fake payloads or replay attacks are rejected instantly with HTTP 401.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Role-Based Access Control (RBAC)</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Granular permissions enforce least-privilege principles across Workspace Owners, Administrators, Managers, and Agents. Server-to-server integrations utilize cryptographically generated API keys with explicitly scoped permissions.
          </p>
        </div>
      </div>

      {/* Deep-Dive Technical Controls */}
      <div className="bg-slate-50 p-8 sm:p-12 rounded-3xl border border-slate-200 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Infrastructure Hardening & Operational Standards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Transport Layer Security (TLS 1.3)</strong>
              All data transmitted between user browsers, our platform servers, and Meta Cloud API endpoints is encrypted using high-grade TLS certificates.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Cluster-Wide Webhook Idempotency</strong>
              Every inbound WhatsApp notification is tracked in persistent relational tables (<code>webhook_events</code>), preventing duplicate processing across load-balanced workers.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Salted OTP Cryptographic Verification</strong>
              Authentication and verification codes are hashed using SHA-256 with salts, enforcing strict 3-attempt lockouts and automatic expiration.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Automated Daily Backups & Disaster Recovery</strong>
              Database state is securely backed up and transaction logs are maintained for point-in-time recovery and zero data loss.
            </div>
          </div>
        </div>
      </div>

      {/* Security Inquiries */}
      <div className="bg-brand-900 text-white p-8 sm:p-10 rounded-3xl space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold">Security Disclosures & Vulnerability Reports</h3>
          <p className="text-xs sm:text-sm text-brand-200 mt-1">
            If you discover a security vulnerability or have questions about our infrastructure, please report it to our engineering team.
          </p>
        </div>
        <a
          href="mailto:hello@digi8solutions.com"
          className="px-6 py-3 bg-white text-slate-900 font-bold text-xs sm:text-sm rounded-xl hover:bg-brand-50 transition-all shrink-0"
        >
          Contact Security Team
        </a>
      </div>
    </div>
  );
};
