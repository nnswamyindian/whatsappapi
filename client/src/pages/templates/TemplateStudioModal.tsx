import React, { useState } from 'react';
import { api } from '../../services/api';
import { WhatsAppBubblePreview } from '../../components/whatsapp/WhatsAppBubblePreview';
import { X, Sparkles, Plus, Trash2, Send, FileCode2, AlertCircle } from 'lucide-react';

interface TemplateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: () => void;
}

export const TemplateStudioModal: React.FC<TemplateStudioModalProps> = ({
  isOpen,
  onClose,
  onTemplateCreated,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerContent, setHeaderContent] = useState('');
  const [bodyText, setBodyText] = useState('Hi {{1}}, thank you for your order! Your tracking code is {{2}}.');
  const [footerText, setFooterText] = useState('Reply STOP to unsubscribe.');
  const [buttons, setButtons] = useState<Array<{ type: 'QUICK_REPLY' | 'URL'; text: string; url?: string }>>([
    { type: 'URL', text: 'Track Order', url: 'https://example.com/track/{{2}}' },
    { type: 'QUICK_REPLY', text: 'Support' },
  ]);

  const [sampleVars, setSampleVars] = useState<string[]>(['Sarah', 'TRACK-9921']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddButton = () => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type: 'QUICK_REPLY', text: `Option ${buttons.length + 1}` }]);
  };

  const handleRemoveButton = (idx: number) => {
    setButtons(buttons.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (action: 'DRAFT' | 'SUBMIT') => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    if (!bodyText.trim()) {
      setError('Body text is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/templates', {
        name,
        category,
        language,
        headerType,
        headerContent: headerType !== 'NONE' ? headerContent : undefined,
        bodyText,
        footerText: footerText || undefined,
        buttons,
        variables: sampleVars,
        action,
      });

      onTemplateCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-base text-slate-900">WhatsApp Template Studio</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Configuration Form */}
          <div className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Template Identifier Name (lowercase, numbers, underscores)
              </label>
              <input
                type="text"
                placeholder="e.g. order_shipment_notification_v1"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-brand-500"
                >
                  <option value="MARKETING">Marketing (Promotions & Offers)</option>
                  <option value="UTILITY">Utility (Account & Order Updates)</option>
                  <option value="AUTHENTICATION">Authentication (Secure OTP Codes)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-brand-500"
                >
                  <option value="en_US">English (US)</option>
                  <option value="en_GB">English (UK)</option>
                  <option value="hi">Hindi (India)</option>
                  <option value="es">Spanish</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>

            {/* Header Options */}
            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50 space-y-2">
              <label className="block font-bold text-slate-800">Header (Optional)</label>
              <div className="flex gap-2">
                {(['NONE', 'TEXT', 'IMAGE'] as const).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setHeaderType(type)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      headerType === type
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {headerType === 'TEXT' && (
                <input
                  type="text"
                  placeholder="e.g. Special Order Update"
                  value={headerContent}
                  onChange={(e) => setHeaderContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              )}

              {headerType === 'IMAGE' && (
                <input
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={headerContent}
                  onChange={(e) => setHeaderContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-[11px]"
                />
              )}
            </div>

            {/* Body Text */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">Body Text</label>
                <span className="text-[11px] text-slate-400">Use {'{{1}}'}, {'{{2}}'} for variables</span>
              </div>
              <textarea
                rows={4}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 font-sans"
              />
            </div>

            {/* Footer Text */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Footer Text (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Reply STOP to opt out"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            {/* Interactive Buttons */}
            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800">Buttons (Max 3)</label>
                {buttons.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddButton}
                    className="flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Button</span>
                  </button>
                )}
              </div>

              {buttons.map((btn, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                  <select
                    value={btn.type}
                    onChange={(e) => {
                      const updated = [...buttons];
                      updated[idx].type = e.target.value as any;
                      setButtons(updated);
                    }}
                    className="px-2 py-1 border border-slate-300 rounded font-semibold text-[11px]"
                  >
                    <option value="QUICK_REPLY">Quick Reply</option>
                    <option value="URL">CTA URL</option>
                  </select>

                  <input
                    type="text"
                    value={btn.text}
                    onChange={(e) => {
                      const updated = [...buttons];
                      updated[idx].text = e.target.value;
                      setButtons(updated);
                    }}
                    placeholder="Button Label"
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                  />

                  {btn.type === 'URL' && (
                    <input
                      type="text"
                      value={btn.url || ''}
                      onChange={(e) => {
                        const updated = [...buttons];
                        updated[idx].url = e.target.value;
                        setButtons(updated);
                      }}
                      placeholder="https://..."
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveButton(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live WhatsApp Chat Bubble Preview */}
          <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Authoritative Live WhatsApp Preview</span>
            </div>
            <WhatsAppBubblePreview
              headerType={headerType}
              headerContent={headerContent}
              bodyText={bodyText}
              footerText={footerText}
              buttons={buttons}
              variables={sampleVars}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('DRAFT')}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 text-xs rounded-xl"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('SUBMIT')}
              disabled={submitting}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting to Meta...' : 'Submit to Meta for Approval'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
