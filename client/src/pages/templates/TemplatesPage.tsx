import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WhatsAppTemplate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TemplateStudioModal } from './TemplateStudioModal';
import { WhatsAppBubblePreview } from '../../components/whatsapp/WhatsAppBubblePreview';
import {
  FileCode2,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);

  const fetchTemplates = () => {
    api.get<WhatsAppTemplate[]>('/templates')
      .then((data) => {
        setTemplates(data);
        if (data.length > 0 && !previewTemplate) {
          setPreviewTemplate(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/whatsapp/sync-templates');
      alert(res.message || 'Templates synchronized with Meta Cloud API');
      fetchTemplates();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const filtered = templates.filter(
    (t) => selectedCategory === 'ALL' || t.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-brand-600" />
            <span>WhatsApp Template Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Design, submit, and synchronize official Meta WhatsApp business message templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync with Meta'}</span>
          </button>

          <button
            onClick={() => setStudioOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Catalog List & Preview Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates Catalog Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900">
              Templates ({filtered.length})
            </h2>
            <span className="text-[11px] text-slate-400">Meta Approval Enforced</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading templates...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FileCode2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <div className="text-xs font-semibold text-slate-700">No templates found</div>
              <button
                onClick={() => setStudioOpen(true)}
                className="mt-3 px-3.5 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-lg shadow-xs"
              >
                Create First Template
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setPreviewTemplate(t)}
                  className={`p-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between ${
                    previewTemplate?.id === t.id ? 'bg-brand-50/40 border-l-4 border-brand-600' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{t.name}</span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                        {t.category}
                      </span>
                      <span>Language: {t.language}</span>
                      {t.header_type !== 'NONE' && (
                        <span>&bull; Header: {t.header_type}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 max-w-md pt-0.5">{t.body_text}</p>
                    {t.rejection_reason && (
                      <div className="text-[11px] text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded mt-1 inline-block">
                        Rejection reason: {t.rejection_reason}
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-brand-700 font-semibold">Preview &rarr;</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col items-center">
          <div className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5 self-start">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Interactive Template Preview</span>
          </div>

          {previewTemplate ? (
            <div className="w-full flex justify-center">
              <WhatsAppBubblePreview
                headerType={previewTemplate.header_type}
                headerContent={previewTemplate.header_content}
                bodyText={previewTemplate.body_text}
                footerText={previewTemplate.footer_text}
                buttons={previewTemplate.buttons}
                variables={['Customer', '40', 'FESTIVE40']}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a template to view live preview
            </div>
          )}
        </div>
      </div>

      {/* Template Studio Modal */}
      <TemplateStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        onTemplateCreated={fetchTemplates}
      />
    </div>
  );
};
