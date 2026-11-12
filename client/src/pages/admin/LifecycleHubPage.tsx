import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  MessageSquare,
  Sparkles,
  Calendar,
  Send,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Zap,
} from 'lucide-react';

export const LifecycleHubPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState('1');
  const [selectedFestival, setSelectedFestival] = useState('New Year Celebrations');
  const [sendingNurture, setSendingNurture] = useState(false);
  const [sendingFestival, setSendingFestival] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/lifecycle/dispatches'),
      api.get('/admin/lifecycle/playbooks'),
      api.get('/admin/lifecycle/festivals'),
    ])
      .then(([disp, pb, fest]) => {
        setDispatches(disp);
        setPlaybooks(pb);
        setFestivals(fest);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunLifecycleCheck = async () => {
    setRunningCheck(true);
    try {
      const res = await api.post('/admin/lifecycle/run-check', {});
      alert(
        `Lifecycle check executed! Reminders sent: ${res.result?.remindersSent || 0}, Nurture messages: ${
          res.result?.nurtureSent || 0
        }`
      );
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to run lifecycle check');
    } finally {
      setRunningCheck(false);
    }
  };

  const handleSendPlaybook = async () => {
    setSendingNurture(true);
    try {
      const res = await api.post('/admin/lifecycle/send-nurture', {
        playbookId: selectedPlaybook,
        organizationId: 'all',
      });
      alert(res.message || 'Growth playbook dispatched!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to send playbook');
    } finally {
      setSendingNurture(false);
    }
  };

  const handleSendFestival = async () => {
    setSendingFestival(true);
    try {
      const res = await api.post('/admin/lifecycle/send-festival', {
        festivalName: selectedFestival,
        organizationId: 'all',
      });
      alert(res.message || 'Festival greetings dispatched!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to send festival greetings');
    } finally {
      setSendingFestival(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-400" />
            <h2 className="text-xl font-black tracking-tight">Omnichannel Client Lifecycle Engine</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Automated WhatsApp & Email customer nurturing throughout the client journey: onboarding nudges, payment receipts, marketing playbooks, festival wishes, and renewal follow-ups.
          </p>
        </div>

        <button
          onClick={handleRunLifecycleCheck}
          disabled={runningCheck}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{runningCheck ? 'Evaluating...' : 'Run Scheduled Check Now'}</span>
        </button>
      </div>

      {/* Manual Dispatch Triggers (Playbooks & Festivals) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Send Marketing Growth Playbook */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Broadcast WhatsApp Growth Playbook</h3>
              <p className="text-xs text-slate-500">
                Send valuable tips to subscribers on how to grow their business on WhatsApp.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block font-bold text-slate-700">Select Playbook Topic</label>
            <select
              value={selectedPlaybook}
              onChange={(e) => setSelectedPlaybook(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
            >
              {playbooks.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSendPlaybook}
            disabled={sendingNurture}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sendingNurture ? 'Dispatching...' : 'Dispatch Playbook to All Active Clients'}</span>
          </button>
        </div>

        {/* Send Festival Wishes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Broadcast Festival & Holiday Wishes</h3>
              <p className="text-xs text-slate-500">
                Send warm festival greetings from MetaGreenWave directly to your clients via WhatsApp.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block font-bold text-slate-700">Select Festival / Holiday</label>
            <select
              value={selectedFestival}
              onChange={(e) => setSelectedFestival(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
            >
              {festivals.map((fest) => (
                <option key={fest.name} value={fest.name}>
                  {fest.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSendFestival}
            disabled={sendingFestival}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{sendingFestival ? 'Dispatching Wishes...' : 'Broadcast Festival Wishes via WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* Dispatched Lifecycle Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Live Lifecycle Dispatches & Follow-Up Audit Log</h3>
            <p className="text-xs text-slate-500">
              Audit trail of every automated WhatsApp and Email message sent by the platform.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                <th className="p-3.5">Client Organization</th>
                <th className="p-3.5">Channel & Event</th>
                <th className="p-3.5">Title & Preview</th>
                <th className="p-3.5">Recipient</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Dispatched At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-400">
                    Loading lifecycle history...
                  </td>
                </tr>
              ) : dispatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-400">
                    No lifecycle dispatches recorded yet.
                  </td>
                </tr>
              ) : (
                dispatches.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{item.org_name || 'System / Client'}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border border-emerald-200">
                          {item.channel}
                        </span>
                        <span className="font-semibold text-slate-700 capitalize">
                          {item.event_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.message_preview}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {item.recipient_phone && (
                        <div className="text-emerald-700 font-bold">{item.recipient_phone}</div>
                      )}
                      {item.recipient_email && (
                        <div className="text-slate-500">{item.recipient_email}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-slate-400 text-[11px]">
                      {new Date(item.dispatched_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

