import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Campaign } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CampaignWizardModal } from './CampaignWizardModal';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  PlusCircle,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const { activeOrg, token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const fetchCampaigns = () => {
    api.get<Campaign[]>('/campaigns')
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();

    // Listen to real-time campaign progress events via SSE
    if (token) {
      const eventSource = new EventSource(`/api/v1/events?token=${token}&orgId=${activeOrg?.id}`);
      eventSource.addEventListener('campaign:progress', (e) => {
        const data = JSON.parse(e.data);
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === data.campaignId
              ? {
                  ...c,
                  sent_count: data.sent_count,
                  delivered_count: data.delivered_count,
                  read_count: data.read_count,
                  failed_count: data.failed_count,
                }
              : c
          )
        );
      });

      eventSource.addEventListener('campaign:completed', () => {
        fetchCampaigns();
      });

      return () => eventSource.close();
    }
  }, [activeOrg?.id, token]);

  const handlePause = async (id: string) => {
    await api.post(`/campaigns/${id}/pause`);
    fetchCampaigns();
  };

  const handleResume = async (id: string) => {
    await api.post(`/campaigns/${id}/resume`);
    fetchCampaigns();
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this campaign?')) {
      await api.post(`/campaigns/${id}/cancel`);
      fetchCampaigns();
    }
  };

  const handleViewDetails = async (id: string) => {
    const data = await api.get(`/campaigns/${id}`);
    setSelectedCampaign(data);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Send className="w-5 h-5 text-brand-600" />
            <span>WhatsApp Campaigns</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, schedule, broadcast, and monitor high-throughput WhatsApp marketing & utility campaigns
          </p>
        </div>

        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Send className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-bold text-slate-800">No campaigns launched yet</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Follow our 4-step wizard to target your audience, map dynamic template variables, and track live deliveries.
            </p>
            <button
              onClick={() => setWizardOpen(true)}
              className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Start First Campaign
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map((camp) => {
              const total = camp.eligible_recipients || 1;
              const sentPct = Math.min(100, Math.round((camp.sent_count / total) * 100));
              const readPct = camp.delivered_count > 0 ? Math.round((camp.read_count / camp.delivered_count) * 100) : 0;

              return (
                <div key={camp.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{camp.name}</span>
                        <StatusBadge status={camp.status} size="sm" />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Template: <strong className="text-slate-700">{camp.template_name}</strong></span>
                        <span>&bull;</span>
                        <span>Eligible: <strong className="text-slate-700">{camp.eligible_recipients}</strong></span>
                        <span>&bull;</span>
                        <span>Total Cost: <strong className="text-slate-700">${(camp.actual_cost || camp.estimated_cost).toFixed(2)}</strong></span>
                        <span>&bull;</span>
                        <span>{new Date(camp.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Progress Bar & Rate Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:w-96">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>{camp.sent_count} / {camp.eligible_recipients} Dispatched</span>
                          <span>{sentPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              camp.status === 'completed' ? 'bg-emerald-600' : 'bg-brand-500'
                            }`}
                            style={{ width: `${sentPct}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span className="text-emerald-700 font-semibold">{camp.delivered_count} delivered</span>
                          <span className="text-blue-700 font-semibold">{camp.read_count} read ({readPct}%)</span>
                          {camp.failed_count > 0 && (
                            <span className="text-rose-600 font-semibold">{camp.failed_count} failed</span>
                          )}
                        </div>
                      </div>

                      {/* Campaign Control Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {camp.status === 'processing' && (
                          <button
                            onClick={() => handlePause(camp.id)}
                            title="Pause Campaign"
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg border border-amber-200"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {camp.status === 'paused' && (
                          <button
                            onClick={() => handleResume(camp.id)}
                            title="Resume Campaign"
                            className="p-1.5 text-brand-700 hover:bg-brand-50 rounded-lg border border-brand-200"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {['processing', 'paused', 'scheduled'].includes(camp.status) && (
                          <button
                            onClick={() => handleCancel(camp.id)}
                            title="Cancel Campaign"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleViewDetails(camp.id)}
                          className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign Details Drawer / Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>{selectedCampaign.name}</span>
                <StatusBadge status={selectedCampaign.status} size="sm" />
              </h3>
              <button onClick={() => setSelectedCampaign(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500">Eligible</div>
                  <div className="font-bold text-base text-slate-900">{selectedCampaign.eligible_recipients}</div>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-emerald-800">Delivered</div>
                  <div className="font-bold text-base text-emerald-950">{selectedCampaign.delivered_count}</div>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-blue-800">Reads</div>
                  <div className="font-bold text-base text-blue-950">{selectedCampaign.read_count}</div>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-rose-800">Failed</div>
                  <div className="font-bold text-base text-rose-950">{selectedCampaign.failed_count}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Recipient Delivery Audit Log (Sample)</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Provider WAMID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {selectedCampaign.recipients?.slice(0, 25).map((r: any) => (
                        <tr key={r.id}>
                          <td className="p-2.5">{r.phone_e164}</td>
                          <td className="p-2.5">
                            <StatusBadge status={r.status} size="sm" />
                          </td>
                          <td className="p-2.5 text-slate-500 truncate max-w-[180px]">{r.provider_message_id || 'Queued'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Wizard Modal */}
      <CampaignWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCampaignCreated={fetchCampaigns}
      />
    </div>
  );
};
