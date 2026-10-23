import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [days, setDays] = useState('30');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/reports/summary?days=${days}`)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  const handleExportCsv = () => {
    window.open('/api/v1/reports/export', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span>Delivery Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent WhatsApp delivery logs, read confirmation ratios, and conversation cost reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="px-3 py-2 bg-slate-100 font-semibold text-xs rounded-xl border border-slate-200 text-slate-700"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Delivered Messages</div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.totals?.delivered?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            {summary?.rates?.deliveryRate || 0}% delivery rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Read Ratio</div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.rates?.readRate || 0}%
          </div>
          <div className="text-[11px] text-blue-700 font-bold mt-1">
            {summary?.totals?.read?.toLocaleString() || 0} verified reads
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Inbound Customer Replies</div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.totals?.replies?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-purple-700 font-bold mt-1">
            2-way conversations
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Messaging Spend</div>
          <div className="text-2xl font-bold text-slate-900">
            ${summary?.totals?.totalCost?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            ${summary?.rates?.costPerDelivered || '0.012'}/delivered
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Messaging Category Breakdown</h2>
          <span className="text-[11px] text-slate-400">Meta Conversation Models</span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Dispatched Messages</th>
                <th className="px-4 py-3">Total Spend (USD)</th>
                <th className="px-4 py-3">Effective Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {summary?.categoryBreakdown?.map((cat: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{cat.template_category || 'UTILITY'}</td>
                  <td className="px-4 py-3 font-mono">{cat.count}</td>
                  <td className="px-4 py-3 font-mono text-brand-900 font-bold">${cat.category_cost.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    ${(cat.category_cost / (cat.count || 1)).toFixed(4)}/msg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
