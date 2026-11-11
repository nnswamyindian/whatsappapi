import React from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Inbox,
  Bot,
  TrendingUp,
  FileCode2,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: Send,
      title: 'WhatsApp Broadcast Campaigns',
      tagline: 'High-throughput marketing and utility broadcasts with zero downtime.',
      description:
        'Deliver personalized messages to thousands of customers simultaneously using pre-approved Meta templates. Benefit from pre-flight audience validation, suppression blacklist filtering, and transparent cost estimates before dispatch.',
      bullets: [
        'Dynamic placeholder variable mapping ({{1}}, {{2}})',
        'Audience segmentation by tags, lifecycle, and consent date',
        'Transparent cost breakdown (Meta provider charge + platform fee)',
        'Real-time delivery, read receipt, and reply rate tracking',
        'Immediate send or timezone-aware scheduling',
      ],
    },
    {
      icon: Inbox,
      title: 'Shared Multi-Agent Team Inbox',
      tagline: 'Collaborative customer service with built-in 24-hour window compliance.',
      description:
        'Equip your support team to answer customer enquiries from a unified WhatsApp number. Track the official Meta 24-hour service window timer, assign conversations to agents or teams, and collaborate using private internal staff notes.',
      bullets: [
        'Live 24-hour customer service countdown timer',
        'Canned quick replies for instant agent productivity',
        'Internal staff notes hidden from customers',
        'Conversation status filters (Open, Pending, Resolved)',
        'Automatic human handoff when agents reply',
      ],
    },
    {
      icon: Bot,
      title: 'Visual Drag-and-Drop Chatbot Studio',
      tagline: 'No-code conversational flows that qualify leads 24/7.',
      description:
        'Build multi-step interactive decision trees using our intuitive canvas editor. Collect customer information, present interactive buttons, branch conditionally based on user choices, and seamlessly hand off to a human agent.',
      bullets: [
        'Interactive button menus and list messages',
        'Question collection nodes with variable storage',
        'Automatic contact tagging and CRM stage updates',
        'Human agent escalation nodes',
        'Draft vs Published version control with instant preview',
      ],
    },
    {
      icon: TrendingUp,
      title: 'WhatsApp CRM & Sales Pipeline',
      tagline: 'Convert WhatsApp chats into closed revenue.',
      description:
        'Stop losing high-intent leads in buried chat threads. Track leads through 8 customizable sales stages, log calls and activities, assign deal values, and attribute conversions directly to specific broadcast campaigns.',
      bullets: [
        'Customizable Kanban sales pipeline stages',
        'Automatic reply classification (pricing, enquiry, support)',
        'Lead deal value and attribution analytics',
        'Agent assignments and follow-up reminders',
        'Complete chronological customer activity audit trail',
      ],
    },
    {
      icon: Zap,
      title: 'Transactional API & Cryptographic OTP',
      tagline: 'Mission-critical messaging for developers and backends.',
      description:
        'Integrate your existing e-commerce, ERP, or CRM platforms with GreenWave using scoped API keys. Generate and verify single-use cryptographic 6-digit WhatsApp OTPs with strict rate limits and 5-minute auto-expiry.',
      bullets: [
        'Scoped API keys (gw_live_...) with granular permissions',
        'Cryptographic SHA-256 hashed OTP storage',
        'Brute-force protection with attempt lockout',
        'Webhooks for real-time delivery callbacks',
        'Ready-to-use curl and Node.js code snippets',
      ],
    },
  ];

  return (
    <div className="py-16 md:py-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Features Deep Dive
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Everything You Need to Scale on WhatsApp
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          From marketing campaigns to customer support and automated lead qualification, GreenWave provides an all-in-one software stack built on official Meta infrastructure.
        </p>
      </div>

      {/* Feature Blocks */}
      <div className="space-y-16">
        {features.map((f, idx) => (
          <div
            key={f.title}
            className={`flex flex-col lg:flex-row items-center gap-10 p-8 sm:p-12 rounded-3xl border border-slate-200 bg-white shadow-sm ${
              idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Text description */}
            <div className="flex-1 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <f.icon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{f.title}</h2>
              <p className="text-sm font-semibold text-brand-700">{f.tagline}</p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{f.description}</p>
              <ul className="space-y-2.5 pt-2">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Box */}
            <div className="w-full lg:w-5/12 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex items-center justify-center text-center space-y-4">
              <div className="space-y-3">
                <f.icon className="w-14 h-14 text-brand-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-base">{f.title}</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Connected directly to official Meta WhatsApp Cloud API v21.0
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 underline pt-2"
                >
                  <span>Try in Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="bg-slate-900 rounded-3xl p-10 sm:p-14 text-center text-white space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight">Explore the Platform Today</h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Sign up to test all features in our interactive sandbox without needing any Meta API credentials up front.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg transition-all"
        >
          <span>Start Free Trial</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

