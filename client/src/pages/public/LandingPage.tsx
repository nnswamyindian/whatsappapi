import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Bot,
  TrendingUp,
  Inbox,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Layers,
  BarChart3,
  HelpCircle,
  Clock,
  Check,
  Cpu,
  RefreshCw,
  Building,
  GraduationCap,
  HeartPulse,
  Home,
  Headphones,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'inbox' | 'chatbots' | 'crm'>('campaigns');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does MetaGreenWave connect to WhatsApp?',
      a: 'MetaGreenWave integrates with the official Meta WhatsApp Cloud API (v21.0) using official Meta Embedded Signup. You connect your official WhatsApp Business Account directly without unofficial browser sessions, phone-scanning hacks, or risk of number bans.',
    },
    {
      q: 'Do I need a separate phone number for WhatsApp Business API?',
      a: 'Yes. Meta requires a phone number that is not currently registered on a standard consumer WhatsApp or WhatsApp Business mobile app. If your number is on WhatsApp, you must delete that account in the WhatsApp app before registering it on the Cloud API.',
    },
    {
      q: 'How do Meta conversation charges work?',
      a: 'Meta charges per 24-hour conversation category (Marketing, Utility, Authentication, and Service). MetaGreenWave displays transparent, country-specific rate cards in your wallet ledger with zero hidden surcharges so you always know your exact delivery costs.',
    },
    {
      q: 'What is the MetaGreenWave platform approval process?',
      a: 'To maintain high delivery quality and prevent spam, our compliance team reviews each new business registration. Once approved by Super Admin, you can immediately connect your Meta WhatsApp account and launch campaigns.',
    },
    {
      q: 'Can multiple agents manage the same WhatsApp number?',
      a: 'Yes! MetaGreenWave includes a Shared Team Inbox with agent assignment, 24-hour customer service window countdown timers, canned quick replies, and internal notes that customers never see.',
    },
    {
      q: 'What happens if a customer replies "STOP"?',
      a: 'MetaGreenWave features automated reply classification rules. If a recipient replies "STOP", they are automatically placed on your suppression blacklist, preventing any future promotional dispatches to comply with global messaging regulations.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 bg-gradient-to-b from-brand-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/70 border border-brand-200 text-brand-900 text-xs font-bold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Official Meta WhatsApp Cloud API Platform (v21.0)</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Every Business Conversation. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600">
              One Powerful Platform.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Manage broadcast campaigns, automate customer journeys with visual chatbots, organize your team with a shared inbox, and close sales with a dedicated WhatsApp CRM.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 transition-all active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base px-8 py-3.5 rounded-2xl transition-all"
            >
              <span>Explore Platform Features</span>
            </Link>
          </div>

          {/* Trust Metrics */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" /> No credit card required for trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" /> Meta Embedded Signup ready
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" /> Multi-tenant workspace isolation
            </span>
          </div>
        </div>

        {/* 2. INTERACTIVE PRODUCT DASHBOARD PREVIEW */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-5 shadow-2xl shadow-slate-200/60 ring-1 ring-slate-900/5">
            {/* Mock Header Tabs */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="ml-3 text-xs font-semibold text-slate-400">metagreenwave.app / workspace / live</span>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'campaigns' ? 'bg-white text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Campaigns
                </button>
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'inbox' ? 'bg-white text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Shared Inbox
                </button>
                <button
                  onClick={() => setActiveTab('chatbots')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'chatbots' ? 'bg-white text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chatbot Studio
                </button>
                <button
                  onClick={() => setActiveTab('crm')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'crm' ? 'bg-white text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sales CRM
                </button>
              </div>
            </div>

            {/* Tab 1: Campaigns Preview */}
            {activeTab === 'campaigns' && (
              <div className="p-4 sm:p-6 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Broadcast Campaigns</h3>
                    <p className="text-xs text-slate-500">Scheduled and live promotional broadcasts with verified rate calculations.</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-brand-100 text-brand-800 rounded-full">
                    99.4% Delivery Rate
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500">Total Sent</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">128,450</div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-1">&uarr; 14.2% this week</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500">Read Receipts</div>
                    <div className="text-2xl font-black text-brand-700 mt-1">84.7%</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1">108,800 confirmed reads</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500">Customer Replies</div>
                    <div className="text-2xl font-black text-indigo-600 mt-1">31.8%</div>
                    <div className="text-[11px] text-indigo-600 font-semibold mt-1">40,847 conversations</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Shared Inbox Preview */}
            {activeTab === 'inbox' && (
              <div className="p-4 sm:p-6 bg-slate-50/70 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                      RD
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Rahul Sharma &bull; +91 98765 43210</h4>
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 24h Customer Service Window Active (18h 42m remaining)
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full">
                    Assigned: Sarah M.
                  </span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
                  <div className="max-w-sm bg-slate-100 p-3 rounded-2xl text-xs text-slate-800">
                    "Hi! Can you confirm if order #9824 can be delivered to our Pune branch by tomorrow?"
                  </div>
                  <div className="max-w-sm ml-auto bg-brand-600 text-white p-3 rounded-2xl text-xs">
                    "Hello Rahul! Yes, priority courier dispatch is scheduled for Pune delivery by 2:00 PM tomorrow."
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Chatbots Preview */}
            {activeTab === 'chatbots' && (
              <div className="p-4 sm:p-6 bg-slate-50/70 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Visual Flow Studio</h3>
                    <p className="text-xs text-slate-500">Multi-step interactive decision trees with buttons, input collection, and human handoff.</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    Active &bull; Trigger: 'hi'
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-white border border-brand-300 rounded-xl font-bold text-brand-900">
                    1. Keyword Trigger ("hi")
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700">
                    2. Send Interactive Menu
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700">
                    3. Ask Lead Details
                  </div>
                  <div className="p-3 bg-white border border-indigo-200 rounded-xl font-bold text-indigo-700">
                    4. Tag & Move in CRM
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: CRM Preview */}
            {activeTab === 'crm' && (
              <div className="p-4 sm:p-6 bg-slate-50/70 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">WhatsApp Sales Kanban</h3>
                    <p className="text-xs text-slate-500">Track leads generated through WhatsApp campaigns from initial enquiry to closed deal.</p>
                  </div>
                  <div className="text-xs font-black text-brand-900 bg-brand-100 px-3 py-1 rounded-full">
                    Pipeline Value: $48,200
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-700">New Leads (18)</span>
                    <p className="text-slate-500 text-[10px] mt-1">$7,400 potential</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200">
                    <span className="font-bold text-purple-700">Qualified (12)</span>
                    <p className="text-slate-500 text-[10px] mt-1">$14,200 potential</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-700">Proposal Shared (7)</span>
                    <p className="text-slate-500 text-[10px] mt-1">$16,800 potential</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-700">Converted (9)</span>
                    <p className="text-slate-500 text-[10px] mt-1">$9,800 won</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. PLATFORM CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Complete Toolkit for Enterprise WhatsApp Operations
          </h2>
          <p className="text-slate-600 text-base">
            Engineered with strict multi-tenancy, regulatory compliance, and asynchronous queues that effortlessly scale to hundreds of thousands of messages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Campaign Orchestration</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Launch targeted marketing or utility broadcasts with audience segment filters, CSV contact mapping, and transparent cost estimates before sending.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Shared Team Inbox</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Enable your customer support team to collaborate in real-time. Includes 24h customer service window timers, canned replies, and private internal notes.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Visual Chatbot Studio</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Design multi-step interactive flows with buttons, questions, and conditional branching. Includes seamless human handoff precedence when agents take over.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">WhatsApp CRM Pipeline</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Track customer lead stages with custom Kanban boards, lead value tracking, automatic reply classification, and activity timeline logs.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Contact & Consent Ledger</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Full E.164 phone normalizer supporting +91, +1, +44, and global country formats. Track explicit opt-in source and enforce automatic suppression blacklists.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Transactional API & OTP</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Integrate order updates, invoices, and cryptographic 6-digit WhatsApp OTPs with SHA-256 hashing, brute-force limits, and 5-minute auto-expiry.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW METAGREENWAVE WORKS */}
      <section id="how-it-works" className="bg-slate-50 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How MetaGreenWave Works
            </h2>
            <p className="text-slate-600 text-base">
              A transparent, compliance-first journey from business registration to your first live broadcast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-900 font-black text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Register & Verify</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Submit business information, intended messaging use case, and verify your official email.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-900 font-black text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Super Admin Review</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our platform compliance team reviews your application to ensure carrier compliance.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-900 font-black text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Meta Embedded Signup</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your WhatsApp Business Account securely using Meta's official login dialog.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-900 font-black text-sm flex items-center justify-center mx-auto">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Configure Templates</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sync pre-approved WhatsApp templates or submit new marketing templates to Meta.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mx-auto">
                5
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Launch & Scale</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Import opted-in contacts, launch campaigns, track live reads, and engage leads in CRM.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INDUSTRY USE CASES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for High-Growth Industries
          </h2>
          <p className="text-slate-600 text-base">
            Every business vertical has unique communication workflows. MetaGreenWave supports them all.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Retail & E-commerce</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Order status notifications, abandoned cart recoveries, promotional product carousels, and 24h instant customer return assistance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Education & Academies</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Course admission enquiries, exam reminders, fee receipt confirmations, and interactive FAQ chatbots for student counseling.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Healthcare & Clinics</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Appointment reminders, lab report ready alerts, and doctor schedule updates with strict patient consent compliance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Home className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Real Estate Agencies</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Property brochures, site visit booking workflows, automated qualifying questionnaires, and sales executive assignment.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Customer Support Centers</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Multi-agent routing, canned quick responses, ticket escalation, and SLA tracking directly on your customers' favorite app.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Financial & SaaS Services</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Two-factor OTP authentication, account alerts, statement PDFs, and automated webhook-driven event confirmations.
            </p>
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT PRICING & PLANS */}
      <section className="bg-slate-50 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Simple, Predictable Platform Pricing
            </h2>
            <p className="text-slate-600 text-base">
              MetaGreenWave charges a straightforward workspace subscription for platform software. WhatsApp message charges are billed directly at transparent Meta rates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">$29</span>
                  <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ideal for small businesses launching WhatsApp messaging with essential broadcast & inbox tools.
                </p>
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 1,000 Contacts Included</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 2 Team Members</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 50 Campaigns / month</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 1 WhatsApp Number</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Shared Team Inbox</div>
                </div>
              </div>
              <Link
                to="/register?plan=starter"
                className="w-full text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-sm transition-all"
              >
                Choose Starter
              </Link>
            </div>

            {/* Growth Plan (Popular) */}
            <div className="bg-white rounded-3xl p-8 border-2 border-brand-600 space-y-6 flex flex-col justify-between shadow-xl relative ring-4 ring-brand-600/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Most Popular
              </div>
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Growth</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">$79</span>
                  <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  For growing teams that need chatbots, automations, and sales pipeline tracking.
                </p>
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-semibold text-slate-900"><Check className="w-4 h-4 text-brand-600" /> 10,000 Contacts Included</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 10 Team Members</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Visual Chatbot Studio</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> WhatsApp Sales CRM</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> No-Code Workflows</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Transactional API & OTP</div>
                </div>
              </div>
              <Link
                to="/register?plan=growth"
                className="w-full text-center py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
              >
                Start Growth Plan
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enterprise</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">$199</span>
                  <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  High-throughput infrastructure with custom roles, dedicated audit logs, and priority SLA.
                </p>
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 100,000 Contacts Included</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 50 Team Members</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 5 WhatsApp Numbers</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Custom RBAC Roles</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> Security Audit Log Export</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-600" /> 24/7 Dedicated Support</div>
                </div>
              </div>
              <Link
                to="/register?plan=enterprise"
                className="w-full text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-sm transition-all"
              >
                Contact Enterprise
              </Link>
            </div>
          </div>

          {/* Genuine Meta Messaging Rate Disclaimer */}
          <div className="bg-brand-50/70 border border-brand-200 rounded-2xl p-6 text-center max-w-4xl mx-auto space-y-2">
            <h4 className="text-sm font-bold text-brand-900">
              💡 Complete Transparency on Meta Messaging Fees
            </h4>
            <p className="text-xs text-brand-800 leading-relaxed">
              Unlike providers that disguise messaging fees, MetaGreenWave reconciles Meta's actual conversation fees directly via transparent double-entry ledgers. For example, India utility messages are ~$0.0018, marketing ~$0.0099; US messages ~$0.0150. No fabricated "unlimited" promises.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-slate-600 text-sm">Everything you need to know about MetaGreenWave and WhatsApp Business API.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full text-left p-5 font-bold text-sm text-slate-900 flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <span className="text-brand-600 font-extrabold text-lg">
                  {openFaqIndex === idx ? '−' : '+'}
                </span>
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. BOTTOM CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-brand-900 via-brand-800 to-emerald-800 rounded-3xl p-8 sm:p-14 text-white text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Ready to upgrade your customer conversations?
          </h2>
          <p className="text-brand-100 text-sm sm:text-base max-w-xl mx-auto font-normal">
            Join hundreds of forward-thinking businesses using MetaGreenWave to power broadcasts, chatbots, and customer support on WhatsApp.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-brand-900 hover:bg-brand-50 font-bold px-8 py-3.5 rounded-2xl shadow-lg transition-all"
            >
              <span>Get Started in 2 Minutes</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

