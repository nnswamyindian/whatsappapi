import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Server, Globe2, MessageSquare, ArrowRight, Lock, CheckCircle2, Database } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          About MetaGreenWave by Digi8 Solutions
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Engineered for Trust, Performance, and Compliance
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          <strong>MetaGreenWave</strong> is a multi-tenant WhatsApp Business Messaging SaaS platform developed and operated by <strong>Digi8 Solutions</strong>. We enable legitimate businesses to communicate reliably, securely, and respectfully with their customers over the official Meta WhatsApp Cloud API.
        </p>
      </div>

      {/* Mission & Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Zero Tolerance for Spam</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We operate an internal administrator review and approval process for every registered business. We mandate explicit recipient opt-in consent records and maintain automated suppression blacklists to protect recipients and maintain high sender quality ratings.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Official Meta Cloud API</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            MetaGreenWave integrates solely through official Meta WhatsApp Cloud API endpoints (v21.0) and official Meta Embedded Signup. We never use unofficial browser automations, reverse-engineered protocols, or unauthorized gateways.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Multi-Tenant Security</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Every business customer is strictly isolated within their own workspace boundary. Tokens and credentials are encrypted at rest with authenticated AES-256-GCM, and queries enforce organization scoping across all 27 database tables.
          </p>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Architecture & Engineering Standards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-bold text-sm">Enterprise MySQL Relational Storage</strong>
              ACID-compliant transactions, connection pooling, foreign-key relational integrity, and cluster-wide multi-worker process safety.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-bold text-sm">Durable Asynchronous Job Queues</strong>
              Message pacing, automatic retries with exponential backoff, and dead-letter queue tracking for campaigns.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-bold text-sm">Real-Time Server-Sent Events (SSE)</strong>
              Non-blocking streaming of delivery receipts, read events, and incoming customer chat messages.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-bold text-sm">Zero-CORS Production Deployment</strong>
              High-performance Node.js backend serves compiled React SPA bundles directly with hardened security headers and Nginx reverse proxy.
            </div>
          </div>
        </div>
      </div>

      {/* Operator Info */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-3">
        <h3 className="text-lg font-bold text-slate-900">Operating Entity & Governance</h3>
        <p>
          MetaGreenWave is built and operated by <strong>Digi8 Solutions</strong>, a modern technology and software solutions organization. For enterprise inquiries, partnership queries, or compliance audits, contact us directly at <a href="mailto:hello@digi8solutions.com" className="text-brand-600 font-bold underline">hello@digi8solutions.com</a>.
        </p>
      </div>
    </div>
  );
};
