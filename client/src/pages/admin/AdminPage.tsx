import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  Users,
  MessageSquare,
  FileText,
  Mail,
  CreditCard,
  History,
  Activity,
} from 'lucide-react';
import { CustomerApplicationsPage } from './CustomerApplicationsPage';
import { TenantManagementPage } from './TenantManagementPage';
import { EmailManagementPage } from './EmailManagementPage';
import { SubscriptionPlansPage } from './SubscriptionPlansPage';
import { AuditLogsPage } from './AuditLogsPage';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'tenants' | 'email' | 'plans' | 'audit'>('applications');
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then((ov) => setOverview(ov))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Super Admin Command Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">GreenWave Super Admin Portal</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global governance, customer onboarding approvals, tenant quotas, and email template dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {overview?.pendingApplications > 0 && (
            <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              {overview.pendingApplications} Pending Approval
            </span>
          )}
          <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-mono font-bold">
            Platform Operator
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold w-full">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'applications'
              ? 'bg-white text-brand-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-brand-700" />
          <span>Customer Applications</span>
          {overview?.pendingApplications > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {overview.pendingApplications}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'tenants'
              ? 'bg-white text-brand-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-brand-700" />
          <span>Tenants & Quotas</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'email'
              ? 'bg-white text-brand-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-brand-700" />
          <span>Email Engine (30)</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'plans'
              ? 'bg-white text-brand-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-brand-700" />
          <span>Subscription Plans</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-brand-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-brand-700" />
          <span>System Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-white text-brand-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 text-brand-700" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'applications' && <CustomerApplicationsPage />}
      {activeTab === 'tenants' && <TenantManagementPage />}
      {activeTab === 'email' && <EmailManagementPage />}
      {activeTab === 'plans' && <SubscriptionPlansPage />}
      {activeTab === 'audit' && <AuditLogsPage />}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">Total Registered Tenants</div>
              <div className="text-3xl font-black text-slate-900">{overview?.tenants?.total || 0}</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                {overview?.tenants?.active || 0} approved & active
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">Pending Approval Queue</div>
              <div className="text-3xl font-black text-amber-600">{overview?.tenants?.pending || 0}</div>
              <div className="text-[11px] text-slate-500 mt-1">Awaiting compliance review</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">Dispatched WhatsApp Messages</div>
              <div className="text-3xl font-black text-slate-900">{overview?.messaging?.total || 0}</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                {overview?.messaging?.delivered || 0} delivered receipts
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">Queue & Engine Status</div>
              <div className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Asynchronous Worker Ready</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Uptime: {Math.floor((overview?.systemHealth?.uptimeSeconds || 0) / 60)} minutes
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
