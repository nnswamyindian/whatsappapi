import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ArrowRight } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const allFaqs = [
    {
      category: 'General & Onboarding',
      q: 'What is MetaGreenWave?',
      a: 'MetaGreenWave is a multi-tenant WhatsApp Business Messaging SaaS platform. It enables businesses to manage broadcast campaigns, collaborate in a shared team inbox, build automated visual chatbots, and track sales leads in a WhatsApp-native CRM.',
    },
    {
      category: 'General & Onboarding',
      q: 'How does the customer application approval process work?',
      a: 'When you register your business profile, our Super Admin compliance team verifies your business details and intended WhatsApp messaging use cases. This prevents carrier spam and ensures high sender quality ratings for all tenants. Once approved, you gain full access to connect your Meta WhatsApp account.',
    },
    {
      category: 'Meta WhatsApp Cloud API',
      q: 'What is Meta Embedded Signup?',
      a: 'Meta Embedded Signup is the official Facebook Login popup dialog where you select or create your WhatsApp Business Account (WABA), verify your phone number via SMS/Voice OTP, and grant messaging permissions directly to MetaGreenWave. Your credentials are authenticated server-side and encrypted with AES-256 at rest.',
    },
    {
      category: 'Meta WhatsApp Cloud API',
      q: 'Can I use an existing WhatsApp phone number?',
      a: 'A phone number can only be registered to one service at a time. If your number is currently used in the consumer WhatsApp app or WhatsApp Business mobile app, you must delete the account within the mobile app settings before connecting it to the official Cloud API.',
    },
    {
      category: 'Campaigns & Templates',
      q: 'Why do WhatsApp templates require approval?',
      a: 'Meta enforces strict quality standards on customer outreach. All outbound marketing, utility, and authentication messages sent outside the customer-initiated 24-hour service window must use pre-approved templates with pre-defined categories and language codes.',
    },
    {
      category: 'Campaigns & Templates',
      q: 'How does MetaGreenWave handle opt-outs and STOP replies?',
      a: 'MetaGreenWave features automated reply classification rules. When a recipient replies "STOP", "UNSUBSCRIBE", or similar keywords, they are immediately added to your workspace suppression list. MetaGreenWave strictly prevents any further promotional campaign deliveries to that number.',
    },
    {
      category: 'Billing & Ledgers',
      q: 'How are Meta conversation fees billed?',
      a: 'Meta charges per 24-hour conversation window based on category (Marketing, Utility, Authentication, or Service). In MetaGreenWave, your wallet balance maintains a transparent double-entry ledger reflecting the exact provider rate and our minimal platform fee ($0.001 - $0.002) with zero hidden markups.',
    },
    {
      category: 'Shared Team Inbox',
      q: 'What is the 24-Hour Customer Service Window?',
      a: 'When a customer sends your business an inbound WhatsApp message, a 24-hour service window opens. During this window, you can exchange free-form text, images, and audio messages without needing an approved template. MetaGreenWave shows a live countdown timer for each conversation.',
    },
  ];

  const filteredFaqs = allFaqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-16 md:py-24 space-y-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Knowledge Base
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-slate-600">
          Clear answers about Meta Cloud API v21.0, onboarding steps, template approvals, and message pricing.
        </p>

        {/* Search Bar */}
        <div className="pt-4 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions (e.g. templates, pricing, 24h window)..."
              className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 mr-2">
                  {faq.category}
                </span>
                <span>{faq.q}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  openIndex === idx ? 'rotate-180 text-brand-600' : ''
                }`}
              />
            </button>
            {openIndex === idx && (
              <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No questions found matching "{search}". Try searching for another term or contact support.
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Still have questions?</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Our team is happy to review your architecture or assist with Meta Business Manager onboarding.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-600 text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-brand-700 transition-all"
        >
          <span>Contact Platform Support</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

