import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Conversation, Message, InternalNote, WhatsAppTemplate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Inbox,
  Send,
  Clock,
  User,
  Tag,
  FileText,
  Lock,
  CornerDownLeft,
  Sparkles,
  CheckCheck,
  Search,
  AlertTriangle,
  PlayCircle,
  PlusCircle,
  Bot,
  PhoneCall,
  Plus,
  X,
  TrendingUp,
} from 'lucide-react';

export const InboxPage: React.FC = () => {
  const { activeOrg, token, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Input states
  const [outboundText, setOutboundText] = useState('');
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [cannedReplies, setCannedReplies] = useState<any[]>([]);
  const [cannedDropdownOpen, setCannedDropdownOpen] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Simulate Inbound message state
  const [simulating, setSimulating] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = () => {
    api.get<Conversation[]>('/inbox/conversations')
      .then((data) => {
        setConversations(data);
        if (data.length > 0 && !activeConvId) {
          setActiveConvId(data[0].id);
        }
      })
      .catch(console.error);
  };

  const fetchActiveThread = (convId: string) => {
    api.get(`/inbox/conversations/${convId}`)
      .then((data) => {
        setActiveConv(data.conversation);
        setMessages(data.messages);
        setNotes(data.internalNotes);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchConversations();
    api.get('/inbox/canned-replies').then(setCannedReplies).catch(console.error);
    api.get('/templates?status=APPROVED').then(setTemplates).catch(console.error);
    api.get('/crm/stages').then(setStages).catch(console.error);
  }, [activeOrg?.id]);

  const toggleControlMode = async () => {
    if (!activeConv) return;
    const newMode = activeConv.control_mode === 'human_controlled' ? 'bot_active' : 'human_controlled';
    try {
      await api.patch(`/inbox/conversations/${activeConv.id}/status`, { control_mode: newMode });
      setActiveConv({ ...activeConv, control_mode: newMode });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, control_mode: newMode } : c))
      );
    } catch (err) {
      console.error('Failed to toggle control mode', err);
    }
  };

  const handleUpdateStage = async (stageId: string) => {
    if (!activeConv) return;
    try {
      await api.patch(`/crm/leads/${activeConv.contact_id}/stage`, { stageId });
      setActiveConv({ ...activeConv, pipeline_stage_id: stageId });
    } catch (err) {
      console.error('Failed to update stage', err);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !activeConv) return;
    const currentTags = activeConv.contactTags || [];
    if (currentTags.includes(newTagInput.trim())) return;
    const updated = [...currentTags, newTagInput.trim()];
    try {
      await api.put(`/contacts/${activeConv.contact_id}`, { tags: updated });
      setActiveConv({ ...activeConv, contactTags: updated });
      setNewTagInput('');
    } catch (err) {
      console.error('Failed to add tag', err);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeConv) return;
    const currentTags = activeConv.contactTags || [];
    const updated = currentTags.filter((t: string) => t !== tagToRemove);
    try {
      await api.put(`/contacts/${activeConv.contact_id}`, { tags: updated });
      setActiveConv({ ...activeConv, contactTags: updated });
    } catch (err) {
      console.error('Failed to remove tag', err);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      fetchActiveThread(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, notes]);

  // Real-time SSE event listener for inbox
  useEffect(() => {
    if (token) {
      const eventSource = new EventSource(`/api/v1/events?token=${token}&orgId=${activeOrg?.id}`);

      eventSource.addEventListener('inbox:inbound_message', () => {
        fetchConversations();
        if (activeConvId) fetchActiveThread(activeConvId);
      });

      eventSource.addEventListener('inbox:message_sent', () => {
        if (activeConvId) fetchActiveThread(activeConvId);
      });

      eventSource.addEventListener('message:status', (e) => {
        const data = JSON.parse(e.data);
        setMessages((prev) =>
          prev.map((m) => (m.provider_message_id === data.wamid ? { ...m, status: data.status } : m))
        );
      });

      return () => eventSource.close();
    }
  }, [token, activeOrg?.id, activeConvId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || (!outboundText && !selectedTemplateName)) return;

    setSending(true);
    try {
      await api.post(`/inbox/conversations/${activeConvId}/messages`, {
        body: outboundText,
        templateName: selectedTemplateName || undefined,
      });

      setOutboundText('');
      setSelectedTemplateName('');
      fetchActiveThread(activeConvId);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch message');
    } finally {
      setSending(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !newNote.trim()) return;

    try {
      await api.post(`/inbox/conversations/${activeConvId}/notes`, { content: newNote });
      setNewNote('');
      setShowNoteInput(false);
      fetchActiveThread(activeConvId);
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    }
  };

  const handleSimulateInbound = async () => {
    if (!activeConv) return;
    setSimulating(true);
    try {
      await api.post('/inbox/simulate-inbound', {
        phone: activeConv.phone_e164,
        body: 'Hello! I need assistance with my recent order delivery tracking.',
      });
      fetchActiveThread(activeConv.id);
      fetchConversations();
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyCanned = (replyText: string) => {
    setOutboundText(replyText);
    setCannedDropdownOpen(false);
  };

  const isWindowActive = activeConv?.is24HourWindowActive;

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-brand-600" />
            <span>Shared Team WhatsApp Inbox</span>
          </h1>
          <p className="text-[11px] text-slate-500">
            Collaborative customer support with WhatsApp 24-hour service window enforcement & internal notes
          </p>
        </div>

        <button
          onClick={handleSimulateInbound}
          disabled={simulating || !activeConv}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4 text-brand-600" />
          <span>{simulating ? 'Simulating...' : 'Simulate Customer Inbound Reply'}</span>
        </button>
      </div>

      {/* Main 3-Pane Inbox Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex overflow-hidden min-h-0">
        {/* Pane 1: Conversations List */}
        <div className="w-full sm:w-80 md:w-88 border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 bg-white text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No active conversations</div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                    activeConvId === c.id ? 'bg-brand-50/50 border-l-4 border-brand-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}` : c.phone_e164}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono mb-1.5">{c.phone_e164}</div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {c.is24HourWindowActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{c.windowExpiresInMinutes}m window</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          Window Closed
                        </span>
                      )}
                    </div>

                    {c.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pane 2: Conversation Thread & Message Input */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
          {activeConv ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900">
                    {activeConv.first_name ? `${activeConv.first_name} ${activeConv.last_name || ''}` : activeConv.phone_e164}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{activeConv.phone_e164}</div>
                </div>

                {/* Controls: Bot/Human Mode Toggle & 24h Window Indicator */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleControlMode}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs ${
                      activeConv.control_mode === 'human_controlled'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                    }`}
                    title="Click to toggle between Bot Auto-Replies and Human Agent control"
                  >
                    {activeConv.control_mode === 'human_controlled' ? (
                      <>
                        <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                        <span>👤 Human Controlled</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5 text-emerald-700" />
                        <span>🤖 Bot Active</span>
                      </>
                    )}
                  </button>

                  {isWindowActive ? (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      <span>24h Window Active: {activeConv.windowExpiresInMinutes} mins left</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>24h Window Expired: Approved Template Required</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 whatsapp-chat-bg">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.direction === 'outbound' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-xl shadow-xs text-xs ${
                        m.direction === 'outbound'
                          ? 'bg-[#E7FFDB] text-slate-900 rounded-tr-none border border-emerald-100'
                          : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                      }`}
                    >
                      {m.template_name && (
                        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1 pb-0.5 border-b border-emerald-200/50">
                          Template: {m.template_name}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {m.direction === 'outbound' && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Internal Notes Display (Clearly distinguished in private amber cards) */}
                {notes.map((n) => (
                  <div key={n.id} className="max-w-[80%] mx-auto bg-amber-50 border border-amber-200 text-amber-950 p-2.5 rounded-xl shadow-xs text-xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 mb-1">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>Private Agent Note &bull; {n.user_name}</span>
                      </span>
                      <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="leading-snug text-slate-800">{n.content}</p>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Note input Drawer (if opened) */}
              {showNoteInput && (
                <div className="p-3 bg-amber-50 border-t border-amber-200">
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add private note for team (never shown to customer)..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      Save Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNoteInput(false)}
                      className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )}

              {/* Message Composer Area */}
              <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                {/* Quick canned replies and notes buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Canned reply dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setCannedDropdownOpen(!cannedDropdownOpen)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                      >
                        <CornerDownLeft className="w-3 h-3 text-slate-500" />
                        <span>Quick Replies ({cannedReplies.length})</span>
                      </button>

                      {cannedDropdownOpen && (
                        <div className="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50">
                          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Canned Responses</div>
                          {cannedReplies.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleApplyCanned(c.content)}
                              className="w-full text-left p-2 hover:bg-brand-50 rounded-lg text-xs"
                            >
                              <div className="font-bold text-slate-800">{c.title} ({c.shortcut})</div>
                              <div className="text-[11px] text-slate-500 truncate">{c.content}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNoteInput(!showNoteInput)}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>+ Internal Note</span>
                    </button>
                  </div>

                  {/* Template Picker (Essential when window is expired) */}
                  {!isWindowActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-amber-800 font-bold">Pick Approved Template:</span>
                      <select
                        value={selectedTemplateName}
                        onChange={(e) => setSelectedTemplateName(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-amber-300 bg-amber-50 font-bold text-amber-900"
                      >
                        <option value="">-- Select Template --</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Form Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    disabled={!isWindowActive && !selectedTemplateName}
                    placeholder={
                      isWindowActive
                        ? 'Type reply to customer (24-hour window open)...'
                        : selectedTemplateName
                        ? `Sending approved template: ${selectedTemplateName}`
                        : '24-hour window closed. Select an approved WhatsApp Template above to send.'
                    }
                    value={outboundText}
                    onChange={(e) => setOutboundText(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!outboundText && !selectedTemplateName)}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Inbox className="w-10 h-10 text-slate-300 mb-2" />
              <span>Select a conversation thread to view messages</span>
            </div>
          )}
        </div>

        {/* Pane 3: Contact Sidebar Details */}
        {activeConv && (
          <div className="hidden lg:flex w-72 border-l border-slate-200 flex-col p-4 bg-white shrink-0 overflow-y-auto space-y-4 text-xs">
            <div className="text-center pb-3 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-800 border border-brand-300 flex items-center justify-center font-bold text-base mx-auto mb-2">
                {activeConv.first_name?.charAt(0) || 'C'}
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {activeConv.first_name || activeConv.last_name ? `${activeConv.first_name || ''} ${activeConv.last_name || ''}` : 'Customer'}
              </div>
              <div className="text-slate-500 font-mono text-[11px] mt-0.5">{activeConv.phone_e164}</div>
            </div>

            {/* CRM Pipeline Stage & Lead Value */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                  CRM Stage
                </span>
                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                  ${(activeConv.lead_value || 1200).toLocaleString()}
                </span>
              </div>
              <select
                value={activeConv.pipeline_stage_id || ''}
                onChange={(e) => handleUpdateStage(e.target.value)}
                className="w-full text-xs font-semibold py-1.5 px-2 bg-white border border-slate-200 rounded-lg focus:ring-brand-500"
              >
                <option value="">Select Pipeline Stage...</option>
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Tags Manager */}
            <div>
              <div className="font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Contact Tags</span>
                <span className="text-[10px] text-slate-400 font-normal">({(activeConv.contactTags || []).length})</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {(activeConv.contactTags || []).map((t: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-brand-50 text-brand-900 border border-brand-200/80 px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-brand-400 hover:text-brand-700"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTag} className="flex gap-1">
                <input
                  type="text"
                  placeholder="+ Add tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="flex-1 text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                >
                  Add
                </button>
              </form>
            </div>

            <div>
              <div className="font-bold text-slate-700 mb-1">Custom Attributes</div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                {Object.entries(activeConv.customFields || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}:</span>
                    <span className="font-semibold text-slate-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div>Assigned Agent: <strong>{activeConv.assigned_agent_name || 'Alex Vance'}</strong></div>
              <div>Team: <strong>{activeConv.assigned_team || 'Tier 1 Support'}</strong></div>
              <div>Mode: <strong>{activeConv.control_mode === 'human_controlled' ? 'Human Controlled' : 'Bot Active'}</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
