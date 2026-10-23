import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { OnboardingStatus, Campaign } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Send,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ChevronRight,
  AlertCircle,
  FileCode2,
  PlusCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const { activeOrg } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<OnboardingStatus>('/organizations/onboarding-status'),
      api.get<Campaign[]>('/campaigns'),
      api.get('/reports/summary?days=30'),
    ])
      .then(([onbData, campData, statsData]) => {
        setOnboarding(onbData);
        setCampaigns(campData.slice(0, 5));
        setStats(statsData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeOrg?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Workspace Overview: {activeOrg?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time delivery operations, audience compliance, and WhatsApp Business campaigns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/campaigns/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Launch Campaign</span>
          </Link>
          <Link
            to="/contacts"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Import Contacts</span>
          </Link>
        </div>
      </div>

      {/* Guided 10-Step Setup Progress Bar */}
      {onboarding && onboarding.percentComplete < 100 && (
        <div className="bg-gradient-to-r from-emerald-50 via-brand-50 to-emerald-100/60 p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-700" />
              <h2 className="font-bold text-sm text-brand-950">
                Setup Progress Checklist ({onboarding.completedCount}/{onboarding.totalSteps} Completed)
              </h2>
            </div>
            <span className="text-xs font-bold text-brand-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {onboarding.percentComplete}% Ready
            </span>
          </div>

          <div className="w-full bg-emerald-200/60 h-2.5 rounded-full overflow-hidden mb-4">
            <div
              className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${onboarding.percentComplete}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            {onboarding.steps.slice(0, 5).map((step) => (
              <Link
                key={step.id}
                to={step.path}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  step.completed
                    ? 'bg-white/90 border-emerald-300 text-emerald-900 font-semibold'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${step.completed ? 'text-brand-600' : 'text-slate-300'}`}
                  />
                  <span className="truncate">{step.title}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Real-Time Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Delivered Messages</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats?.totals?.delivered?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {stats?.rates?.deliveryRate || 0}% delivery rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Read Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats?.rates?.readRate || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats?.totals?.read?.toLocaleString() || 0} verified reads
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Inbound Replies</span>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats?.totals?.replies?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            2-way conversations
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Spend (Last 30 Days)</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats?.totals?.totalCost?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg ${stats?.rates?.costPerDelivered || '0.012'}/delivered
          </div>
        </div>
      </div>

      {/* Recent Campaigns Table & Quick Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Recent Messaging Campaigns</h2>
          <Link to="/campaigns" className="text-xs text-brand-700 font-semibold hover:underline">
            View All Campaigns &rarr;
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Send className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No campaigns launched yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Create your first WhatsApp campaign in 4 easy steps</p>
            <Link
              to="/campaigns/new"
              className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-brand-700"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Campaign Name</th>
                  <th className="px-4 py-3">Template</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Eligible</th>
                  <th className="px-4 py-3">Delivered</th>
                  <th className="px-4 py-3">Read Rate</th>
                  <th className="px-4 py-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((camp) => {
                  const readPct = camp.delivered_count > 0 ? Math.round((camp.read_count / camp.delivered_count) * 100) : 0;
                  return (
                    <tr key={camp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{camp.name}</td>
                      <td className="px-4 py-3 text-slate-600">{camp.template_name || 'Standard'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={camp.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-mono">{camp.eligible_recipients}</td>
                      <td className="px-4 py-3 font-mono text-emerald-700 font-semibold">{camp.delivered_count}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{readPct}%</td>
                      <td className="px-4 py-3 font-mono">${(camp.actual_cost || camp.estimated_cost).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
