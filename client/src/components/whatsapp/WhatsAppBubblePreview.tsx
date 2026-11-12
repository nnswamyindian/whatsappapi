import React from 'react';
import { ExternalLink, Phone, CornerDownLeft, CheckCheck, FileText, Play, Copy, ChevronLeft, ChevronRight } from 'lucide-react';

export interface WhatsAppBubbleProps {
  headerType?: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerContent?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
  variables?: Record<string, string> | string[];
  timestamp?: string;
  isCarousel?: boolean;
  cards?: Array<{
    cardIndex: number;
    headerType?: 'IMAGE' | 'VIDEO';
    headerUrl?: string;
    bodyText: string;
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL';
      text: string;
      url?: string;
    }>;
  }>;
}

export const WhatsAppBubblePreview: React.FC<WhatsAppBubbleProps> = ({
  headerType = 'NONE',
  headerContent,
  bodyText,
  footerText,
  buttons = [],
  variables,
  timestamp = '11:42 AM',
  isCarousel = false,
  cards = [],
}) => {
  const [activeCardIndex, setActiveCardIndex] = React.useState(0);

  // Replace variable placeholders like {{1}}, {{2}} with provided values or fallback
  const renderTextWithVariables = (text: string) => {
    if (!text) return '';
    return text.replace(/\{\{(\d+)\}\}/g, (match, p1) => {
      if (Array.isArray(variables)) {
        const idx = parseInt(p1, 10) - 1;
        return variables[idx] !== undefined ? variables[idx] : `[${p1}]`;
      } else if (variables && typeof variables === 'object') {
        return variables[p1] !== undefined ? variables[p1] : `[${p1}]`;
      }
      return match;
    });
  };

  return (
    <div className="w-full max-w-[340px] rounded-2xl shadow-md border border-slate-200 overflow-hidden bg-slate-100 flex flex-col font-sans">
      {/* WhatsApp Header bar */}
      <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            GW
          </div>
          <div>
            <div className="text-xs font-semibold leading-tight">MetaGreenWave Verified</div>
            <div className="text-[10px] text-emerald-100 leading-none">Official Business Account</div>
          </div>
        </div>
      </div>

      {/* Chat Background & Message Container */}
      <div className="whatsapp-chat-bg p-3.5 min-h-[220px] flex flex-col justify-end">
        {/* Outbound Bubble */}
        <div className="bg-[#E7FFDB] text-slate-800 rounded-lg rounded-tr-none p-2.5 shadow-sm border border-emerald-100/60 max-w-[95%] self-end">
          {/* Header */}
          {headerType === 'TEXT' && headerContent && (
            <div className="text-xs font-bold text-slate-900 mb-1.5 pb-1 border-b border-emerald-200/50">
              {renderTextWithVariables(headerContent)}
            </div>
          )}

          {headerType === 'IMAGE' && headerContent && (
            <div className="mb-2 rounded overflow-hidden max-h-36 bg-slate-200">
              <img
                src={headerContent}
                alt="Header"
                className="w-full h-auto object-cover max-h-36"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {headerType === 'VIDEO' && headerContent && (
            <div className="mb-2 rounded overflow-hidden h-32 bg-slate-900 flex items-center justify-center relative">
              <Play className="w-10 h-10 text-white/80 fill-white/80" />
              <div className="absolute bottom-1 right-2 text-[9px] text-white/90 bg-black/50 px-1 rounded">0:30</div>
            </div>
          )}

          {headerType === 'DOCUMENT' && (
            <div className="mb-2 p-2 rounded bg-emerald-50 border border-emerald-200/70 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-800 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-emerald-950 truncate">
                  {headerContent || 'Document.pdf'}
                </div>
                <div className="text-[9px] text-emerald-700">PDF Document &bull; 245 KB</div>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {renderTextWithVariables(bodyText || 'Start typing message body...')}
          </div>

          {/* Footer */}
          {footerText && (
            <div className="text-[10px] text-slate-500 mt-1.5 pt-1 border-t border-emerald-100/80">
              {footerText}
            </div>
          )}

          {/* Timestamp and Read Double-Check */}
          <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500">
            <span>{timestamp}</span>
            <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>

        {/* Buttons (Quick replies, CTAs, Copy Code) */}
        {!isCarousel && buttons.length > 0 && (
          <div className="mt-1 flex flex-col gap-1 w-[95%] self-end">
            {buttons.map((btn, idx) => (
              <div
                key={idx}
                className="bg-white hover:bg-slate-50 text-[#00A884] text-xs font-semibold py-2 px-3 rounded-lg shadow-sm text-center flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
              >
                {btn.type === 'URL' && <ExternalLink className="w-3.5 h-3.5" />}
                {btn.type === 'PHONE_NUMBER' && <Phone className="w-3.5 h-3.5" />}
                {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-3.5 h-3.5" />}
                {btn.type === 'COPY_CODE' && <Copy className="w-3.5 h-3.5" />}
                <span>{btn.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Carousel Multi-Card Interactive Preview */}
        {isCarousel && cards.length > 0 && (
          <div className="mt-2 w-full">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 px-1">
              <span>Card {activeCardIndex + 1} of {cards.length}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={activeCardIndex === 0}
                  onClick={() => setActiveCardIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1 rounded bg-white shadow-xs disabled:opacity-40"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-700" />
                </button>
                <button
                  type="button"
                  disabled={activeCardIndex === cards.length - 1}
                  onClick={() => setActiveCardIndex((prev) => Math.min(cards.length - 1, prev + 1))}
                  className="p-1 rounded bg-white shadow-xs disabled:opacity-40"
                >
                  <ChevronRight className="w-3 h-3 text-slate-700" />
                </button>
              </div>
            </div>

            {/* Active Carousel Card */}
            {cards[activeCardIndex] && (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                {cards[activeCardIndex].headerUrl ? (
                  <div className="h-28 bg-slate-200 overflow-hidden">
                    <img
                      src={cards[activeCardIndex].headerUrl}
                      alt="Card Header"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                    No card image provided
                  </div>
                )}

                <div className="p-2.5 text-xs text-slate-800 leading-snug">
                  {renderTextWithVariables(cards[activeCardIndex].bodyText)}
                </div>

                {cards[activeCardIndex].buttons && cards[activeCardIndex].buttons!.length > 0 && (
                  <div className="border-t border-slate-100 flex flex-col divide-y divide-slate-100">
                    {cards[activeCardIndex].buttons!.map((cb, cidx) => (
                      <div
                        key={cidx}
                        className="py-1.5 text-center text-[#00A884] font-semibold text-[11px] flex items-center justify-center gap-1 hover:bg-slate-50 cursor-pointer"
                      >
                        {cb.type === 'URL' && <ExternalLink className="w-3 h-3" />}
                        {cb.type === 'QUICK_REPLY' && <CornerDownLeft className="w-3 h-3" />}
                        <span>{cb.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
