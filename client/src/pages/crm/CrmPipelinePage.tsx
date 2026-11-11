import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PipelineStage, CrmLead, CrmActivity, ReplyRule } from '../../types';
import {
  Kanban,
  Plus,
  Search,
  Filter,
  DollarSign,
  Phone,
  Mail,
  User,
  Clock,
  Tag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  X,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const CrmPipelinePage: React.FC = () => {
  const { token, activeOrg } = useAuth();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [replyRules, setReplyRules] = useState<ReplyRule[]>([]);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [leadActivities, setLeadActivities] = useState<CrmActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'rules'>('pipeline');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState<boolean>(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState<boolean>(false);
  const [newActivityNote, setNewActivityNote] = useState<string>('');
  const [activityType, setActivityType] = useState<'note' | 'call' | 'meeting'>('note');

  // Form states for new lead
  const [newLeadPhone, setNewLeadPhone] = useState<string>('');
  const [newLeadFirstName, setNewLeadFirstName] = useState<string>('');
  const [newLeadLastName, setNewLeadLastName] = useState<string>('');
  const [newLeadValue, setNewLeadValue] = useState<string>('500');
  const [newLeadStageId, setNewLeadStageId] = useState<string>('');
  const [newLeadSource, setNewLeadSource] = useState<string>('WhatsApp Inbound');

  // Form states for new reply rule
  const [ruleName, setRuleName] = useState<string>('');
  const [ruleKeyword, setRuleKeyword] = useState<string>('');
  const [ruleCategory, setRuleCategory] = useState<string>('Pricing Enquiry');
  const [ruleTags, setRuleTags] = useState<string>('high-intent, pricing');
  const [ruleIsOptout, setRuleIsOptout] = useState<boolean>(false);

  useEffect(() => {
    fetchStages();
    fetchLeads();
    fetchReplyRules();
  }, [activeOrg?.id]);

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/v1/crm/stages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStages(data);
        if (data.length > 0) setNewLeadStageId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/v1/crm/leads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReplyRules = async () => {
    try {
      const res = await fetch('/api/v1/reply-rules', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReplyRules(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openLeadDrawer = async (lead: CrmLead) => {
    setSelectedLead(lead);
    try {
      const res = await fetch(`/api/v1/crm/leads/${lead.id}/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeadActivities(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveStage = async (leadId: string, newStageId: string) => {
    try {
      const res = await fetch(`/api/v1/crm/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stageId: newStageId }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, pipeline_stage_id: newStageId } : l))
        );
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, pipeline_stage_id: newStageId });
          openLeadDrawer({ ...selectedLead, pipeline_stage_id: newStageId });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadPhone.trim()) return;

    try {
      const res = await fetch('/api/v1/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: newLeadPhone,
          firstName: newLeadFirstName,
          lastName: newLeadLastName,
          pipelineStageId: newLeadStageId,
          leadValue: parseFloat(newLeadValue) || 0,
          leadSource: newLeadSource,
        }),
      });
      if (res.ok) {
        setIsAddLeadModalOpen(false);
        setNewLeadPhone('');
        setNewLeadFirstName('');
        setNewLeadLastName('');
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddActivity = async () => {
    if (!selectedLead || !newActivityNote.trim()) return;
    try {
      const res = await fetch(`/api/v1/crm/leads/${selectedLead.id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activityType,
          title: `${activityType.toUpperCase()}: ${newActivityNote.substring(0, 30)}...`,
          description: newActivityNote,
        }),
      });
      if (res.ok) {
        setNewActivityNote('');
        openLeadDrawer(selectedLead);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !ruleKeyword.trim()) return;
    try {
      const tagList = ruleTags.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await fetch('/api/v1/reply-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: ruleName,
          trigger_keyword: ruleKeyword,
          category: ruleCategory,
          tags: tagList,
          is_optout: ruleIsOptout,
        }),
      });
      if (res.ok) {
        setIsAddRuleModalOpen(false);
        setRuleName('');
        setRuleKeyword('');
        fetchReplyRules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered leads
  const filteredLeads = leads.filter(
    (l) =>
      l.phone_e164.includes(searchQuery) ||
      (l.first_name && l.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.last_name && l.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.lead_value || 0), 0);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800">WhatsApp CRM & Sales Pipeline</h1>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                ${totalPipelineValue.toLocaleString()} Total Value
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage leads, conversation attribution, pipeline stages, and automatic reply tagging
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pipeline Board
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'rules'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Reply Classification ({replyRules.length})
            </button>
          </div>

          {activeTab === 'pipeline' ? (
            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          ) : (
            <button
              onClick={() => setIsAddRuleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Reply Rule
            </button>
          )}
        </div>
      </div>

      {activeTab === 'pipeline' ? (
        /* Kanban Pipeline View */
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search & Filter toolbar */}
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads by name or phone..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong>{filteredLeads.length}</strong> leads across <strong>{stages.length}</strong> stages
            </div>
          </div>

          {/* Horizontal Scrollable Stages Container */}
          <div className="flex-1 flex gap-3 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.pipeline_stage_id === stage.id);
              const stageTotal = stageLeads.reduce((s, l) => s + (l.lead_value || 0), 0);

              return (
                <div
                  key={stage.id}
                  className="w-72 bg-slate-100/90 rounded-2xl flex flex-col shrink-0 border border-slate-200/80 shadow-2xs overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color || '#3B82F6' }}
                      />
                      <span className="text-xs font-bold text-slate-800">{stage.name}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {stageLeads.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      ${stageTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Lead Cards List */}
                  <div className="p-2 space-y-2 overflow-y-auto flex-1">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => openLeadDrawer(lead)}
                        className={`bg-white p-3 rounded-xl border border-slate-200/90 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group ${
                          selectedLead?.id === lead.id ? 'ring-2 ring-brand-500 border-brand-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div className="font-bold text-xs text-slate-800 truncate group-hover:text-brand-900">
                            {lead.first_name || 'WhatsApp Contact'} {lead.last_name || ''}
                          </div>
                          <span className="text-[11px] font-extrabold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 font-mono">
                            ${(lead.lead_value || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.phone_e164}</span>
                        </div>

                        {/* Tags */}
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {lead.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Quick stage mover action */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 truncate max-w-[110px]">
                            {lead.lead_source || 'Inbound'}
                          </span>
                          <select
                            value={lead.pipeline_stage_id}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleMoveStage(lead.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-700 py-0.5 px-1 focus:ring-brand-500 cursor-pointer"
                          >
                            {stages.map((st) => (
                              <option key={st.id} value={st.id}>
                                → {st.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="p-4 text-center text-slate-400 text-xs italic">
                        No leads in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Automatic Reply Classification & Tagging Rules Tab */
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Intelligent Inbound Reply Classification Rules
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                When customers reply on WhatsApp, GreenWave evaluates keyword triggers, auto-tags contacts, routes leads to sales pipeline stages, and suppresses opted-out users from subsequent marketing campaigns.
              </p>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {replyRules.map((rule) => (
                  <div key={rule.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{rule.name}</span>
                        {rule.is_optout ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Marketing Opt-out
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {rule.category || 'Lead Qualification'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span>Trigger: <strong className="font-mono text-slate-700">"{rule.trigger_keyword}"</strong> ({rule.match_type})</span>
                        {rule.add_tags_json && (
                          <span>Adds: <strong className="text-teal-700">{rule.add_tags_json}</strong></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active Rule
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Lead Activity Drawer (Right Side) */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                {(selectedLead.first_name || 'W')[0]}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {selectedLead.first_name || 'WhatsApp Contact'} {selectedLead.last_name || ''}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">{selectedLead.phone_e164}</div>
              </div>
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lead Details */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Pipeline Stage:</span>
              <select
                value={selectedLead.pipeline_stage_id}
                onChange={(e) => handleMoveStage(selectedLead.id, e.target.value)}
                className="text-xs font-bold text-slate-800 border border-slate-200 rounded-lg py-1 px-2 focus:ring-brand-500"
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Lead Deal Value:</span>
              <span className="font-bold text-brand-700 font-mono text-sm">
                ${(selectedLead.lead_value || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Source:</span>
              <span className="font-semibold text-slate-700">{selectedLead.lead_source || 'WhatsApp'}</span>
            </div>
          </div>

          {/* Activity Log Form */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center gap-2">
              {(['note', 'call', 'meeting'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActivityType(t)}
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md transition-all ${
                    activityType === t
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newActivityNote}
                onChange={(e) => setNewActivityNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                placeholder={`Log ${activityType} notes...`}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
              <button
                onClick={handleAddActivity}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold"
              >
                Log
              </button>
            </div>
          </div>

          {/* Activities Timeline */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Interaction Timeline
            </div>
            {leadActivities.map((act) => (
              <div key={act.id} className="border-l-2 border-brand-500 pl-3 py-0.5 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{act.title}</span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {act.description && (
                  <p className="text-[11px] text-slate-600">{act.description}</p>
                )}
              </div>
            ))}
            {leadActivities.length === 0 && (
              <div className="text-center text-slate-400 text-xs py-8">
                No CRM activities logged yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateLead}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add New CRM Lead</h3>
              <button type="button" onClick={() => setIsAddLeadModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">WhatsApp Phone (E.164)*</label>
                <input
                  type="text"
                  required
                  placeholder="+14155552671"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newLeadFirstName}
                    onChange={(e) => setNewLeadFirstName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newLeadLastName}
                    onChange={(e) => setNewLeadLastName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Deal Value ($)</label>
                  <input
                    type="number"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Stage</label>
                  <select
                    value={newLeadStageId}
                    onChange={(e) => setNewLeadStageId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddLeadModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs"
              >
                Save Lead
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Reply Rule Modal */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateRule}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Reply Rule</h3>
              <button type="button" onClick={() => setIsAddRuleModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Rule Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pricing Keyword Trigger"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Inbound Keyword*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. price, demo, quote"
                  value={ruleKeyword}
                  onChange={(e) => setRuleKeyword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Category</label>
                <input
                  type="text"
                  value={ruleCategory}
                  onChange={(e) => setRuleCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Tags to apply (comma-separated)</label>
                <input
                  type="text"
                  value={ruleTags}
                  onChange={(e) => setRuleTags(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={ruleIsOptout}
                  onChange={(e) => setRuleIsOptout(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="font-semibold text-slate-700">Treat as Marketing Opt-out (e.g. STOP)</span>
              </label>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddRuleModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs"
              >
                Create Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
