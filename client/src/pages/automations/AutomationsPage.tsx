import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  GitBranch,
  PlusCircle,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  Tag,
  UserCheck,
  Zap,
  X,
  AlertCircle,
} from 'lucide-react';

export const AutomationsPage: React.FC = () => {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<any[] | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('message_received');
  const [triggerKeyword, setTriggerKeyword] = useState('PRICE');
  const [actionTemplate, setActionTemplate] = useState('order_status_update');
  const [actionTag, setActionTag] = useState('Inbound Lead');

  const fetchAutomations = () => {
    api.get('/automations')
      .then(setAutomations)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleToggle = async (id: string) => {
    await api.patch(`/automations/${id}/toggle`, {});
    fetchAutomations();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/automations', {
        name,
        description,
        triggerType,
        triggerConfig: { keyword: triggerKeyword },
        flowDefinition: [
          { type: 'trigger', title: `When inbound message contains "${triggerKeyword}"` },
          { type: 'action', title: `Send WhatsApp Template "${actionTemplate}"` },
          { type: 'action', title: `Add Contact Tag "${actionTag}"` },
        ],
      });
      setCreateModalOpen(false);
      setName('');
      setDescription('');
      fetchAutomations();
    } catch (err: any) {
      alert(err.message || 'Failed to create automation');
    }
  };

  const handleViewLogs = async (id: string) => {
    const logs = await api.get(`/automations/${id}/logs`);
    setSelectedLogs(logs);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-brand-600" />
            <span>Visual No-Code Automations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Event-driven triggers, keyword auto-replies, dynamic tags, and multi-step branching workflows
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs col-span-2">Loading automations...</div>
        ) : automations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 col-span-2 bg-white rounded-2xl border border-slate-200">
            <Zap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-bold text-slate-800">No active workflows yet</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Automate standard customer interactions like greeting keywords, lead tagging, and tracking dispatches.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Build First Workflow
            </button>
          </div>
        ) : (
          automations.map((auto) => (
            <div
              key={auto.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-900">{auto.name}</span>
                  <button
                    onClick={() => handleToggle(auto.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                      auto.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {auto.isActive ? 'Active' : 'Paused'}
                  </button>
                </div>
                <p className="text-xs text-slate-500">{auto.description || 'Automated WhatsApp event handler'}</p>

                {/* Visual Step Canvas Pills */}
                <div className="mt-4 space-y-2 border-l-2 border-brand-200 pl-3 py-1">
                  {auto.flowDefinition?.map((step: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-800 font-bold text-[9px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-700">{step.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400">
                  Executed <strong>{auto.execution_count}</strong> times
                </span>
                <button
                  onClick={() => handleViewLogs(auto.id)}
                  className="text-brand-700 hover:underline font-semibold"
                >
                  View Execution Logs
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Workflow Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-600" />
                <span>Create WhatsApp Automation Workflow</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Workflow Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instant Pricing Auto-Reply"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Trigger Condition</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800">When Customer Sends WhatsApp Message</div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Matching Keyword:</span>
                    <input
                      type="text"
                      value={triggerKeyword}
                      onChange={(e) => setTriggerKeyword(e.target.value.toUpperCase())}
                      className="px-2 py-1 border border-slate-300 rounded font-mono font-bold bg-white uppercase text-brand-900 w-28"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Automated Actions</label>
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">1. Dispatch Approved Template</span>
                    <input
                      type="text"
                      value={actionTemplate}
                      onChange={(e) => setActionTemplate(e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">2. Apply Contact Tag</span>
                    <input
                      type="text"
                      value={actionTag}
                      onChange={(e) => setActionTag(e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded bg-white text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Activate Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
