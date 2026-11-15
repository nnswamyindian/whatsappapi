import React from 'react';
import { CheckCircle2, Activity, Server, Radio, ShieldCheck, Clock } from 'lucide-react';

export const StatusPage: React.FC = () => {
  const services = [
    {
      name: 'Meta WhatsApp Cloud API Gateway (v21.0)',
      description: 'Outbound template dispatch, text messaging, and media delivery',
      status: 'Operational',
      uptime: '99.98%',
    },
    {
      name: 'Webhook Ingestion Engine',
      description: 'HMAC-SHA256 signature verification & persistent multi-worker idempotency',
      status: 'Operational',
      uptime: '100%',
    },
    {
      name: 'Enterprise MySQL Relational Database',
      description: 'Multi-tenant isolated tables, encrypted credentials, and ACID transactions',
      status: 'Operational',
      uptime: '99.99%',
    },
    {
      name: 'Real-Time Server-Sent Events (SSE)',
      description: 'Live delivery receipts, read markers, and incoming customer chat streaming',
      status: 'Operational',
      uptime: '99.95%',
    },
    {
      name: 'Asynchronous Campaign Job Dispatcher',
      description: 'Paced batch processing, rate-limit adherence, and queue scheduling',
      status: 'Operational',
      uptime: '99.99%',
    },
  ];

  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Platform Health & Telemetry
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          System Operational Status
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Current status of <strong>MetaGreenWave</strong> core infrastructure, operated by <strong>Digi8 Solutions</strong>.
        </p>
      </div>

      {/* Big Status Banner */}
      <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-950">All Systems Fully Operational</h2>
            <p className="text-xs text-emerald-800">
              No active incidents reported. Meta WhatsApp Cloud API services operating at normal latency.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-900 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-300">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Updated Just Now</span>
        </div>
      </div>

      {/* Services Table */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Core Services Status</h3>
        <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
          {services.map((s, idx) => (
            <div key={idx} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>{s.name}</span>
                </div>
                <p className="text-xs text-slate-500">{s.description}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
                  {s.uptime} uptime
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{s.status}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Uptime Note */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 text-sm">Service Reliability & Monitoring</h4>
        <p>
          MetaGreenWave endpoints are monitored continuously across global regions with automated health checks every 60 seconds. In the event of upstream Meta API maintenance or degraded quality ratings, notifications are displayed directly within customer workspaces.
        </p>
        <p className="pt-2">
          For technical status inquiries or to report an issue, contact <a href="mailto:hello@digi8solutions.com" className="text-brand-600 font-semibold underline">hello@digi8solutions.com</a>.
        </p>
      </div>
    </div>
  );
};
