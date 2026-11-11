import React, { useEffect, useState } from 'react';
import {
  Mail,
  Search,
  Eye,
  Edit2,
  Send,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';

export const EmailManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Preview & Edit State
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [editText, setEditText] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [testSendLoading, setTestSendLoading] = useState(false);

  const fetchTemplates = async () => {
    try {
      const data = await api.get('/admin/email-templates');
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load email templates:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await api.get('/admin/email-logs');
      setLogs(data);
    } catch (err) {
      console.error('Failed to load email logs:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTemplates(), fetchLogs()]).finally(() => setLoading(false));
  }, []);

  const handleOpenPreview = async (tpl: any) => {
    setSelectedTemplate(tpl);
    setIsEditing(false);
    try {
      const sampleVars = {
        fullName: 'Alex Vance',
        businessName: 'Apex Retail Global',
        applicationId: 'APP-9842',
        verifyUrl: 'http://localhost:5000/verify-email?token=sample_token',
        onboardingUrl: 'http://localhost:5000/onboarding',
        actionUrl: 'http://localhost:5000/application-status',
        rejectionReason: 'Business verification document was not provided.',
        requestDetails: 'Please provide GSTIN or Certificate of Incorporation.',
        phoneNumber: '+91 98765 43210',
        wabaId: 'WABA_98241088214',
        templateName: 'order_status_update',
        category: 'UTILITY',
        campaignName: 'Flash Festive Sale 2026',
        recipientCount: 5400,
        sentCount: 5400,
        deliveredCount: 5380,
        readCount: 4720,
        planName: 'Growth',
        amount: '79.00',
        invoiceNumber: 'INV-2026-081',
        date: 'Nov 11, 2026',
        supportEmail: 'support@greenwave.io',
      };
      const res = await api.post(`/admin/email-templates/${tpl.slug}/preview`, { variables: sampleVars });
      setPreviewData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (tpl: any) => {
    setSelectedTemplate(tpl);
    setIsEditing(true);
    setEditSubject(tpl.subject);
    setEditHtml(tpl.html_content);
    setEditText(tpl.text_content);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await api.put(`/admin/email-templates/${selectedTemplate.id}`, {
        subject: editSubject,
        htmlContent: editHtml,
        textContent: editText,
      });
      await fetchTemplates();
      setSelectedTemplate(null);
      alert('Email template saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to save template');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTestSend = async (slug: string) => {
    setTestSendLoading(true);
    try {
      const res = await api.post(`/admin/email-templates/${slug}/test-send`, {});
      if (res.success) {
        alert('Test email queued and delivered to your platform administrator email.');
        await fetchLogs();
      } else {
        alert('Test send failed: ' + res.error);
      }
    } catch (err: any) {
      alert(err.message || 'Test send error');
    } finally {
      setTestSendLoading(false);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Centralized Email Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage 30 transactional email event templates, preview dynamic HTML hydration, and review delivery audit logs.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'templates' ? 'bg-white text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Email Templates (30)
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'logs' ? 'bg-white text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delivery Logs ({logs.length})
          </button>
        </div>
      </div>

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates (e.g. approved, otp, verification)..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Template Event</th>
                    <th className="p-3.5">Slug</th>
                    <th className="p-3.5">Subject Line</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTemplates.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{t.name}</td>
                      <td className="p-3.5 font-mono text-slate-500 text-[11px]">{t.slug}</td>
                      <td className="p-3.5 font-medium text-slate-800 max-w-xs truncate">{t.subject}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenPreview(t)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-brand-700" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleTestSend(t.slug)}
                          disabled={testSendLoading}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3 text-indigo-700" />
                          <span>Test</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Recipient</th>
                  <th className="p-3.5">Template Slug</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{log.recipient}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{log.template_slug}</td>
                    <td className="p-3.5 max-w-sm truncate">{log.subject}</td>
                    <td className="p-3.5">
                      {log.status === 'sent' && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          Delivered / Sent
                        </span>
                      )}
                      {log.status === 'failed' && (
                        <span className="bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          Failed: {log.error_message}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview / Edit Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isEditing ? 'Edit Template' : 'Template Preview'} &bull; {selectedTemplate.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">Slug: {selectedTemplate.slug}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject Line</label>
                  <input
                    type="text"
                    required
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">HTML Content</label>
                  <textarea
                    rows={8}
                    required
                    value={editHtml}
                    onChange={(e) => setEditHtml(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plain Text Fallback</label>
                  <textarea
                    rows={4}
                    required
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm"
                  >
                    {saveLoading ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 font-bold">Subject: </span>
                  <span className="font-bold text-slate-900">{previewData?.subject || selectedTemplate.subject}</span>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-white overflow-hidden max-h-80 overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: previewData?.html || selectedTemplate.html_content,
                    }}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => handleTestSend(selectedTemplate.slug)}
                    disabled={testSendLoading}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Email</span>
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

