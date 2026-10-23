import React from 'react';
import { ExternalLink, Phone, CornerDownLeft, CheckCheck } from 'lucide-react';

interface WhatsAppBubbleProps {
  headerType?: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerContent?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
  variables?: Record<string, string> | string[];
  timestamp?: string;
}

export const WhatsAppBubblePreview: React.FC<WhatsAppBubbleProps> = ({
  headerType = 'NONE',
  headerContent,
  bodyText,
  footerText,
  buttons = [],
  variables,
  timestamp = '11:42 AM',
}) => {
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
            <div className="text-xs font-semibold leading-tight">GreenWave Verified</div>
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

        {/* Buttons (Quick replies or CTAs) */}
        {buttons.length > 0 && (
          <div className="mt-1 flex flex-col gap-1 w-[95%] self-end">
            {buttons.map((btn, idx) => (
              <div
                key={idx}
                className="bg-white hover:bg-slate-50 text-[#00A884] text-xs font-semibold py-2 px-3 rounded-lg shadow-sm text-center flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
              >
                {btn.type === 'URL' && <ExternalLink className="w-3.5 h-3.5" />}
                {btn.type === 'PHONE_NUMBER' && <Phone className="w-3.5 h-3.5" />}
                {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-3.5 h-3.5" />}
                <span>{btn.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
