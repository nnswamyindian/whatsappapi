import React, { useState } from 'react';
import { api } from '../../services/api';
import { WhatsAppBubblePreview } from '../../components/whatsapp/WhatsAppBubblePreview';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Send,
  FileCode2,
  AlertCircle,
  Layers,
  Image as ImageIcon,
  Download,
  Upload,
  Video,
  FileText,
  CheckCircle2,
  Loader2,
  Globe,
  Paperclip,
} from 'lucide-react';

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
  const [isCarousel, setIsCarousel] = useState(false);

  // Standard Template State
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerContent, setHeaderContent] = useState('');
  const [bodyText, setBodyText] = useState('Hi {{1}}, thank you for your order! Your tracking code is {{2}}.');
  const [footerText, setFooterText] = useState('Reply STOP to unsubscribe.');
  const [buttons, setButtons] = useState<Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE'; text: string; url?: string; phoneNumber?: string }>>([
    { type: 'URL', text: 'Track Order', url: 'https://example.com/track/{{2}}' },
    { type: 'QUICK_REPLY', text: 'Support' },
  ]);

  // Carousel Cards State (2 to 10 cards)
  const [carouselCards, setCarouselCards] = useState<Array<{
    cardIndex: number;
    headerType: 'IMAGE' | 'VIDEO';
    headerUrl: string;
    bodyText: string;
    buttons: Array<{ type: 'QUICK_REPLY' | 'URL'; text: string; url?: string }>;
  }>>([
    {
      cardIndex: 0,
      headerType: 'IMAGE',
      headerUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      bodyText: 'Chrono Luxury Watch - 20% OFF today only!',
      buttons: [{ type: 'URL', text: 'View Watch', url: 'https://example.com/watch' }],
    },
    {
      cardIndex: 1,
      headerType: 'IMAGE',
      headerUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      bodyText: 'ANC Wireless Headphones - Studio grade sound.',
      buttons: [{ type: 'URL', text: 'View Audio', url: 'https://example.com/audio' }],
    },
  ]);

  const [sampleVars, setSampleVars] = useState<string[]>(['Sarah', 'TRACK-9921']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Media upload state
  const [headerInputMode, setHeaderInputMode] = useState<'UPLOAD' | 'URL'>('UPLOAD');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{ name: string; size: number } | null>(null);

  const handleMediaUpload = async (file: File, cardIndex?: number) => {
    const sizeMB = file.size / (1024 * 1024);
    const targetType = cardIndex !== undefined ? carouselCards[cardIndex]?.headerType || 'IMAGE' : headerType;

    if (targetType === 'IMAGE' && sizeMB > 5) {
      setError(`Selected image (${sizeMB.toFixed(1)}MB) exceeds Meta limit of 5MB.`);
      return;
    }
    if (targetType === 'VIDEO' && sizeMB > 16) {
      setError(`Selected video (${sizeMB.toFixed(1)}MB) exceeds Meta limit of 16MB.`);
      return;
    }
    if (targetType === 'DOCUMENT' && sizeMB > 100) {
      setError(`Selected document (${sizeMB.toFixed(1)}MB) exceeds Meta limit of 100MB.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const res = await api.post<any>('/templates/upload-media', {
        fileName: file.name,
        fileType: file.type,
        fileBase64: base64Data,
        mediaType: targetType,
      });

      if (res.url) {
        if (cardIndex !== undefined) {
          const updated = [...carouselCards];
          updated[cardIndex].headerUrl = res.url;
          setCarouselCards(updated);
        } else {
          setHeaderContent(res.url);
          setUploadedFileMeta({ name: file.name, size: file.size });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload media. Please try again or paste a media URL.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const handleAddButton = () => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type: 'QUICK_REPLY', text: `Option ${buttons.length + 1}` }]);
  };

  const handleRemoveButton = (idx: number) => {
    setButtons(buttons.filter((_, i) => i !== idx));
  };

  const handleAddCarouselCard = () => {
    if (carouselCards.length >= 10) return;
    const newIdx = carouselCards.length;
    setCarouselCards([
      ...carouselCards,
      {
        cardIndex: newIdx,
        headerType: 'IMAGE',
        headerUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        bodyText: `Card #${newIdx + 1} highlight product or service offer`,
        buttons: [{ type: 'QUICK_REPLY', text: 'Learn More' }],
      },
    ]);
  };

  const handleRemoveCarouselCard = (idx: number) => {
    if (carouselCards.length <= 2) {
      setError('Carousel templates require at least 2 cards according to Meta specifications.');
      return;
    }
    const updated = carouselCards.filter((_, i) => i !== idx).map((c, i) => ({ ...c, cardIndex: i }));
    setCarouselCards(updated);
  };

  const handleSubmit = async (action: 'DRAFT' | 'SUBMIT') => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    if (!isCarousel) {
      if (!bodyText.trim()) {
        setError('Body text is required');
        return;
      }
      if (bodyText.length > 1024) {
        setError(`Body text exceeds Meta limit of 1024 characters (${bodyText.length}/1024)`);
        return;
      }
      if (headerType === 'TEXT' && headerContent.length > 60) {
        setError('Header text exceeds Meta limit of 60 characters');
        return;
      }
    } else {
      if (carouselCards.length < 2 || carouselCards.length > 10) {
        setError('Meta requires Carousel templates to have between 2 and 10 cards.');
        return;
      }
      for (let i = 0; i < carouselCards.length; i++) {
        if (!carouselCards[i].bodyText.trim()) {
          setError(`Card #${i + 1} body text is required.`);
          return;
        }
        if (carouselCards[i].bodyText.length > 160) {
          setError(`Card #${i + 1} body text exceeds Meta limit of 160 characters.`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/templates', {
        name,
        category,
        language,
        isCarousel,
        headerType: !isCarousel ? headerType : 'NONE',
        headerContent: !isCarousel && headerType !== 'NONE' ? headerContent : undefined,
        bodyText: !isCarousel ? bodyText : 'Carousel Template',
        footerText: footerText || undefined,
        buttons: !isCarousel ? buttons : [],
        cards: isCarousel ? carouselCards : [],
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-base text-slate-900">WhatsApp Template Studio</h2>
            <span className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full font-semibold">
              Meta Graph API v21.0
            </span>
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
                Template Identifier (lowercase letters, numbers, underscores)
              </label>
              <input
                type="text"
                placeholder="e.g. seasonal_promo_carousel_v1"
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
                  onChange={(e) => {
                    const cat = e.target.value as any;
                    setCategory(cat);
                    if (cat === 'AUTHENTICATION') {
                      setIsCarousel(false);
                      setHeaderType('NONE');
                      setBodyText('Your verification code is {{1}}. Valid for {{2}} minutes.');
                      setButtons([{ type: 'COPY_CODE', text: 'Copy Code' }]);
                    }
                  }}
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

            {/* Template Format Selector (Standard vs Carousel) */}
            {category === 'MARKETING' && (
              <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-600" />
                    <span>Carousel Template (Multi-Card)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Interactive scrollable cards (2 to 10 cards) with individual media and buttons
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isCarousel}
                  onChange={(e) => setIsCarousel(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </div>
            )}

            {/* STANDARD TEMPLATE BUILDER */}
            {!isCarousel && (
              <>
                {/* Header Options */}
                {category !== 'AUTHENTICATION' && (
                  <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block font-bold text-slate-800">Header Format</label>
                      {headerType === 'TEXT' && (
                        <span className="text-[10px] text-slate-400">{headerContent.length} / 60</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as const).map((type) => (
                        <button
                          type="button"
                          key={type}
                          onClick={() => {
                            setHeaderType(type);
                            if (type === 'NONE' || type === 'TEXT') {
                              setUploadedFileMeta(null);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1 ${
                            headerType === type
                              ? 'bg-brand-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {type === 'IMAGE' && <ImageIcon className="w-3 h-3" />}
                          {type === 'VIDEO' && <Video className="w-3 h-3" />}
                          {type === 'DOCUMENT' && <FileText className="w-3 h-3" />}
                          <span>{type}</span>
                        </button>
                      ))}
                    </div>

                    {headerType === 'TEXT' && (
                      <input
                        type="text"
                        maxLength={60}
                        placeholder="e.g. Special Order Update"
                        value={headerContent}
                        onChange={(e) => setHeaderContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    )}

                    {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && (
                      <div className="space-y-2.5 pt-1">
                        {/* Tab Switcher: Upload File vs Paste URL */}
                        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg w-fit text-[11px]">
                          <button
                            type="button"
                            onClick={() => setHeaderInputMode('UPLOAD')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                              headerInputMode === 'UPLOAD'
                                ? 'bg-white text-brand-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeaderInputMode('URL')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                              headerInputMode === 'URL'
                                ? 'bg-white text-brand-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Globe className="w-3 h-3" />
                            <span>Media URL</span>
                          </button>
                        </div>

                        {/* Upload File Zone */}
                        {headerInputMode === 'UPLOAD' ? (
                          headerContent && uploadedFileMeta ? (
                            <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                                  {headerType === 'IMAGE' && <ImageIcon className="w-4 h-4" />}
                                  {headerType === 'VIDEO' && <Video className="w-4 h-4" />}
                                  {headerType === 'DOCUMENT' && <FileText className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 text-xs truncate">
                                    {uploadedFileMeta.name}
                                  </div>
                                  <div className="text-[10px] text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Uploaded ({(uploadedFileMeta.size / 1024).toFixed(0)} KB)</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setHeaderContent('');
                                  setUploadedFileMeta(null);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 text-xs font-semibold ml-2 shrink-0"
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <label className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                              isUploading ? 'border-brand-400 bg-brand-50/50' : 'border-slate-300 hover:border-brand-500 hover:bg-slate-100/50 bg-white'
                            }`}>
                              <input
                                type="file"
                                className="hidden"
                                disabled={isUploading}
                                accept={
                                  headerType === 'IMAGE'
                                    ? 'image/jpeg,image/png,image/webp'
                                    : headerType === 'VIDEO'
                                    ? 'video/mp4,video/3gpp'
                                    : '.pdf,.doc,.docx,.xlsx,.txt'
                                }
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleMediaUpload(e.target.files[0]);
                                  }
                                }}
                              />
                              {isUploading ? (
                                <div className="flex items-center gap-2 text-brand-700 py-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="font-semibold text-xs">Uploading media to server...</span>
                                </div>
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                                    <Upload className="w-4 h-4" />
                                  </div>
                                  <div className="text-center">
                                    <span className="font-bold text-brand-700 text-xs">Click to upload {headerType.toLowerCase()}</span>
                                    <span className="text-slate-500 text-xs"> or drag & drop</span>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {headerType === 'IMAGE' && 'PNG, JPG, or WebP (max 5MB)'}
                                      {headerType === 'VIDEO' && 'MP4 or 3GP (max 16MB)'}
                                      {headerType === 'DOCUMENT' && 'PDF, DOCX, XLSX (max 100MB)'}
                                    </p>
                                  </div>
                                </>
                              )}
                            </label>
                          )
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="url"
                              placeholder={
                                headerType === 'IMAGE'
                                  ? 'https://example.com/banner.jpg'
                                  : headerType === 'VIDEO'
                                  ? 'https://example.com/demo.mp4'
                                  : 'https://example.com/invoice.pdf'
                              }
                              value={headerContent}
                              onChange={(e) => setHeaderContent(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-[11px]"
                            />
                            <p className="text-[10px] text-slate-400">
                              Must be a publicly accessible HTTPS link to sample {headerType.toLowerCase()} for Meta review.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Body Text */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Body Text *</label>
                    <span className="text-[11px] text-slate-400">
                      {bodyText.length} / 1024 characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={1024}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 font-sans"
                  />
                </div>

                {/* Footer Text */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-700">Footer Text</label>
                    <span className="text-[10px] text-slate-400">{footerText.length} / 60</span>
                  </div>
                  <input
                    type="text"
                    maxLength={60}
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
                    {buttons.length < 3 && category !== 'AUTHENTICATION' && (
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
                        <option value="PHONE_NUMBER">Call Phone</option>
                        {category === 'AUTHENTICATION' && <option value="COPY_CODE">Copy Code</option>}
                      </select>

                      <input
                        type="text"
                        maxLength={25}
                        value={btn.text}
                        onChange={(e) => {
                          const updated = [...buttons];
                          updated[idx].text = e.target.value;
                          setButtons(updated);
                        }}
                        placeholder="Button Label (max 25 chars)"
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
              </>
            )}

            {/* CAROUSEL CARDS BUILDER (2 to 10 cards) */}
            {isCarousel && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800">Carousel Cards ({carouselCards.length} / 10)</div>
                  {carouselCards.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddCarouselCard}
                      className="flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Card</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {carouselCards.map((card, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>Card #{idx + 1}</span>
                        {carouselCards.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCarouselCard(idx)}
                            className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-600">Card Header Media</label>
                          <label className="text-[10px] text-brand-700 hover:text-brand-900 cursor-pointer font-bold flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded border border-brand-200 transition-colors">
                            <Upload className="w-3 h-3" />
                            <span>Upload Media</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp,video/mp4"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleMediaUpload(e.target.files[0], idx);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/... or click Upload Media above"
                          value={card.headerUrl}
                          onChange={(e) => {
                            const updated = [...carouselCards];
                            updated[idx].headerUrl = e.target.value;
                            setCarouselCards(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-semibold text-slate-600">Card Body Text *</label>
                          <span className="text-[10px] text-slate-400">{card.bodyText.length} / 160</span>
                        </div>
                        <textarea
                          rows={2}
                          maxLength={160}
                          value={card.bodyText}
                          onChange={(e) => {
                            const updated = [...carouselCards];
                            updated[idx].bodyText = e.target.value;
                            setCarouselCards(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Action Button</label>
                        {card.buttons.map((b, bidx) => (
                          <div key={bidx} className="flex gap-2">
                            <input
                              type="text"
                              maxLength={25}
                              value={b.text}
                              onChange={(e) => {
                                const updated = [...carouselCards];
                                updated[idx].buttons[bidx].text = e.target.value;
                                setCarouselCards(updated);
                              }}
                              placeholder="Button Label"
                              className="w-1/2 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                            />
                            <input
                              type="text"
                              value={b.url || ''}
                              onChange={(e) => {
                                const updated = [...carouselCards];
                                updated[idx].buttons[bidx].url = e.target.value;
                                setCarouselCards(updated);
                              }}
                              placeholder="https://..."
                              className="w-1/2 px-2 py-1 border border-slate-300 rounded text-xs font-mono bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Live WhatsApp Chat Bubble Preview */}
          <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Authoritative Live WhatsApp Preview</span>
            </div>
            <WhatsAppBubblePreview
              headerType={!isCarousel ? headerType : 'NONE'}
              headerContent={!isCarousel ? headerContent : undefined}
              bodyText={!isCarousel ? bodyText : 'Carousel Template'}
              footerText={footerText}
              buttons={!isCarousel ? buttons : []}
              variables={sampleVars}
              isCarousel={isCarousel}
              cards={isCarousel ? carouselCards : []}
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
