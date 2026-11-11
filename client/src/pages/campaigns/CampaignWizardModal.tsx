import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WhatsAppTemplate } from '../../types';
import { WhatsAppBubblePreview } from '../../components/whatsapp/WhatsAppBubblePreview';
import {
  X,
  Users,
  MessageSquare,
  CheckCircle2,
  Rocket,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

interface CampaignWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
}

export const CampaignWizardModal: React.FC<CampaignWizardModalProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [audienceType, setAudienceType] = useState('all_contacts');
  const [tagFilter, setTagFilter] = useState('');
  const [variableMappings, setVariableMappings] = useState<Record<string, string>>({
    '1': 'first_name',
    '2': 'order_id',
    '3': 'discount_code',
  });
  const [testPhone, setTestPhone] = useState('+919876543210');
  const [testSendStatus, setTestSendStatus] = useState<string | null>(null);

  const [estimate, setEstimate] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.get<WhatsAppTemplate[]>('/templates?status=APPROVED')
        .then((tpls) => {
          setTemplates(tpls);
          if (tpls.length > 0 && !selectedTemplateId) {
            setSelectedTemplateId(tpls[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleFetchEstimate = async () => {
    if (!selectedTemplateId) return;
    setEstimating(true);
    setError(null);
    try {
      const res = await api.post('/campaigns/estimate', {
        templateId: selectedTemplateId,
        audienceType: tagFilter ? 'tag' : 'all_contacts',
        audienceFilter: tagFilter ? { tag: tagFilter } : {},
      });
      setEstimate(res);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate audience estimate');
    } finally {
      setEstimating(false);
    }
  };

  const handleTestSend = async () => {
    setTestSendStatus('Sending test message...');
    try {
      const res = await api.post('/campaigns/test-send', {
        templateId: selectedTemplateId,
        testPhone,
        sampleVariables: ['Sarah', '40', 'FESTIVE40'],
      });
      setTestSendStatus(
        res.isSandbox
          ? 'Delivered in Sandbox! Check conversation in Shared Inbox.'
          : 'Delivered via Meta Cloud API!'
      );
    } catch (err: any) {
      setTestSendStatus(`Test send failed: ${err.message}`);
    }
  };

  const handleLaunchCampaign = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/campaigns', {
        name: name || `Campaign ${new Date().toLocaleDateString()}`,
        templateId: selectedTemplateId,
        audienceType: tagFilter ? 'tag' : 'all_contacts',
        audienceFilter: tagFilter ? { tag: tagFilter } : {},
        variableMappings,
        scheduledAt: isScheduled ? scheduledAt : undefined,
      });
      onCampaignCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to launch campaign');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header & Steps indicator */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-brand-600" />
              <span>Guided WhatsApp Campaign Wizard</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className={step >= 1 ? 'font-bold text-brand-700' : ''}>1. Audience</span>
              <span>&rarr;</span>
              <span className={step >= 2 ? 'font-bold text-brand-700' : ''}>2. Message & Preview</span>
              <span>&rarr;</span>
              <span className={step >= 3 ? 'font-bold text-brand-700' : ''}>3. Review & Cost</span>
              <span>&rarr;</span>
              <span className={step >= 4 ? 'font-bold text-brand-700' : ''}>4. Launch</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: AUDIENCE SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Festive Flash Sale October"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAudienceType('all_contacts');
                      setTagFilter('');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      audienceType === 'all_contacts'
                        ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 mb-0.5">All Active Contacts</div>
                    <div className="text-[11px] text-slate-500">
                      Deliver to all consented contacts in your workspace
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudienceType('tag')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      audienceType === 'tag'
                        ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 mb-0.5">Filter by Segment / Tag</div>
                    <div className="text-[11px] text-slate-500">
                      Target specific tags like VIP, Lead, or Repeat Customer
                    </div>
                  </button>
                </div>
              </div>

              {audienceType === 'tag' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter Tag Name</label>
                  <input
                    type="text"
                    placeholder="e.g. VIP"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Automated WhatsApp Compliance Enforcement</div>
                  <div className="text-emerald-800 text-[11px] mt-0.5">
                    GreenWave will automatically cross-check every recipient against your workspace suppression and opt-out list before submitting to Meta. Suppressed contacts are excluded automatically with zero charges.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MESSAGE TEMPLATE & VARIABLE MAPPING */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Template Selection & Variable Mappings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Approved WhatsApp Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category} - {t.language})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <div className="text-xs font-bold text-slate-800">Map Dynamic Variables</div>
                  <div className="text-[11px] text-slate-500">
                    Match template variables to contact attributes:
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 font-bold w-12 text-center">
                        {'{{1}}'}
                      </span>
                      <select
                        value={variableMappings['1'] || 'first_name'}
                        onChange={(e) =>
                          setVariableMappings({ ...variableMappings, '1': e.target.value })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                      >
                        <option value="first_name">Contact First Name</option>
                        <option value="last_name">Contact Last Name</option>
                        <option value="phone">Contact Phone Number</option>
                        <option value="40">Static: "40"</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 font-bold w-12 text-center">
                        {'{{2}}'}
                      </span>
                      <select
                        value={variableMappings['2'] || 'discount_code'}
                        onChange={(e) =>
                          setVariableMappings({ ...variableMappings, '2': e.target.value })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                      >
                        <option value="discount_code">Static Promo Code: "FESTIVE40"</option>
                        <option value="order_id">Custom Field: order_id</option>
                        <option value="first_name">Contact First Name</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Instant Test Send Box */}
                <div className="border border-brand-200 bg-brand-50/40 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-bold text-brand-950 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-brand-700" />
                    <span>Send Immediate Test Message</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestSend}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      Send Test
                    </button>
                  </div>
                  {testSendStatus && (
                    <div className="text-[11px] font-semibold text-brand-800">{testSendStatus}</div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Chat Bubble Preview */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 mb-2">Live WhatsApp Bubble Preview</div>
                {selectedTemplate && (
                  <WhatsAppBubblePreview
                    headerType={selectedTemplate.header_type}
                    headerContent={selectedTemplate.header_content}
                    bodyText={selectedTemplate.body_text}
                    footerText={selectedTemplate.footer_text}
                    buttons={selectedTemplate.buttons}
                    variables={['Sarah', '40', 'FESTIVE40']}
                    isCarousel={Boolean(selectedTemplate.isCarousel)}
                    cards={selectedTemplate.cards || []}
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & TRANSPARENT COST ESTIMATION */}
          {step === 3 && estimate && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">Total Audience Found</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{estimate.totalRecipients}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-800">Eligible Recipients</div>
                  <div className="text-xl font-bold text-brand-900 mt-0.5">{estimate.eligibleRecipients}</div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <div className="text-xs text-rose-800">Suppressed / Excluded</div>
                  <div className="text-xl font-bold text-rose-900 mt-0.5">{estimate.excludedRecipients}</div>
                </div>
              </div>

              {/* Transparent Cost Breakdown Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Transparent Rate Breakdown ({estimate.template.category} Category)</span>
                  <span className="text-[11px] text-slate-500 font-normal">Per-recipient pricing</span>
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Meta WhatsApp Provider Messaging Charge:</span>
                    <span className="font-mono font-semibold">
                      ${estimate.costBreakdown.estimatedProviderCharges.toFixed(2)} (${estimate.costBreakdown.providerRatePerMsg}/msg)
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">GreenWave Platform Infrastructure Fee:</span>
                    <span className="font-mono font-semibold">
                      ${estimate.costBreakdown.estimatedPlatformCharges.toFixed(2)} (${estimate.costBreakdown.platformFeePerMsg}/msg)
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-bold text-slate-900 border-t border-slate-200">
                    <span>Total Estimated Campaign Charge:</span>
                    <span className="font-mono text-brand-800">${estimate.costBreakdown.totalEstimatedCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Wallet Readiness Check */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  estimate.wallet.hasSufficientBalance
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 shrink-0 text-brand-700" />
                  <div>
                    <span className="font-bold">Current Wallet Balance: </span>
                    <span className="font-mono font-bold">${estimate.wallet.currentBalance.toFixed(2)}</span>
                    {!estimate.wallet.hasSufficientBalance && (
                      <span className="block text-[11px] text-amber-800 mt-0.5">
                        Shortfall: ${estimate.wallet.shortfall.toFixed(2)}. Please top up your messaging wallet to proceed.
                      </span>
                    )}
                  </div>
                </div>
                {estimate.wallet.hasSufficientBalance && (
                  <span className="bg-emerald-200 text-emerald-950 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    Sufficient Balance
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SCHEDULE & LAUNCH */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-900 text-sm">Campaign Launch Confirmation</div>
                <p className="text-slate-600">
                  You are about to submit <strong>{name || 'Campaign'}</strong> to{' '}
                  <strong>{estimate?.eligibleRecipients || 0} eligible WhatsApp recipients</strong>.
                </p>
                <div className="text-[11px] text-slate-500">
                  Messages accepted by the Meta provider will be transmitted immediately and cannot be recalled once dispatched.
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="scheduleToggle"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <label htmlFor="scheduleToggle" className="text-xs font-bold text-slate-800">
                    Schedule Campaign for Later
                  </label>
                </div>

                {isScheduled && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Target Broadcast Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (step > 1) setStep((step - 1) as any);
              else onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {step === 1 ? 'Cancel' : '&larr; Back'}
          </button>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Next: Select Message &rarr;
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleFetchEstimate}
                disabled={estimating}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                {estimating ? 'Calculating...' : 'Next: Review Cost &rarr;'}
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!estimate?.isReadyToLaunch}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                Proceed to Launch &rarr;
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handleLaunchCampaign}
                disabled={submitting}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : isScheduled ? 'Confirm Schedule' : 'Launch Campaign Now'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
