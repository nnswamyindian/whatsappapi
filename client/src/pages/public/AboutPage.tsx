import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Server, Globe2, MessageSquare, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          About GreenWave
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Engineered for Trust, Performance, and Compliance
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          GreenWave is an enterprise-grade software platform built to enable legitimate businesses to communicate reliably and respectfully with their customers over WhatsApp.
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
            We operate an internal Super Admin approval process for every registered business. We mandate explicit opt-in consent records and maintain automated suppression blacklists to protect recipients and maintain high sender quality ratings.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Official Infrastructure Only</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            GreenWave integrates solely through official Meta WhatsApp Cloud API endpoints (v21.0) and Meta Embedded Signup. We never use unofficial browser automations, reverse-engineered protocols, or unauthorized gateways.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Multi-Tenant Security</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Every business customer is isolated within their own strict workspace boundary. Tokens and secrets are encrypted at rest with AES-256-GCM, and queries enforce organization scoping across all 24 relational database tables.
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
            <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-bold text-sm">WAL Mode Relational Storage</strong>
              SQLite with Write-Ahead Logging for high concurrency, low latency, and single-file backup capability.
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
              <strong className="text-slate-900 block font-bold text-sm">Zero CORS Single-Port Deployment</strong>
              Express efficiently serves the compiled React client bundle directly on port 5000 in production.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

