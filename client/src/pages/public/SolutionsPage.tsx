import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  GraduationCap,
  HeartPulse,
  Home,
  Headphones,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const SolutionsPage: React.FC = () => {
  const verticals = [
    {
      icon: ShoppingBag,
      title: 'Retail & E-commerce',
      description:
        'Engage shoppers with rich visual catalogs, automated dispatch updates, and personalized festival discount campaigns.',
      metrics: '3.4x higher response rates compared to standard promotional SMS.',
      benefits: [
        'Automated order confirmation and tracking URLs',
        'Abandoned cart recovery alerts with quick checkout buttons',
        'Customer satisfaction rating collection post-delivery',
        'Seamless instant returns & exchange handling in shared inbox',
      ],
    },
    {
      icon: GraduationCap,
      title: 'Education & Coaching Institutes',
      description:
        'Automate course admission enquiries, student counseling chats, exam schedules, and tuition fee reminders.',
      metrics: 'Over 80% reduction in phone inquiry load with interactive FAQ bots.',
      benefits: [
        'Interactive admission inquiry decision tree chatbots',
        'Parent updates on attendance, fees, and report cards',
        'Automated exam reminder alerts with syllabus PDF attachments',
        'Lead qualification for high-value executive coaching courses',
      ],
    },
    {
      icon: HeartPulse,
      title: 'Healthcare & Wellness Clinics',
      description:
        'Keep patients informed with appointment booking confirmations, diagnostic lab report links, and health checkup reminders.',
      metrics: '42% decrease in missed appointments through automated 24h reminders.',
      benefits: [
        'Explicit patient opt-in consent ledger tracking',
        'Appointment booking & rescheduling bot workflows',
        'Automated prescription & diagnostic report delivery',
        'Strict suppression management respecting patient opt-out',
      ],
    },
    {
      icon: Home,
      title: 'Real Estate & Property Developers',
      description:
        'Showcase property brochures, floor plans, and arrange site visit appointments with high-intent homebuyers.',
      metrics: 'Instant lead assignment connects agents to buyers within 60 seconds.',
      benefits: [
        'Property brochure PDF & image carousel broadcasts',
        'Automated site visit scheduling and calendar confirmations',
        'Lead budget & preference qualification in Chatbot Studio',
        'Kanban sales pipeline to track deals from site visit to closure',
      ],
    },
    {
      icon: Headphones,
      title: 'Customer Support Desks',
      description:
        'Consolidate multi-agent support inquiries onto one verified WhatsApp number with SLA tracking and fast canned replies.',
      metrics: 'Cut first-response time down to under 2 minutes.',
      benefits: [
        '24-Hour customer service window countdown compliance',
        'Team assignment (e.g. Billing, Technical Support, Returns)',
        'Private agent notes for seamless handovers between shifts',
        'Post-resolution CSAT surveys sent automatically',
      ],
    },
    {
      icon: Building,
      title: 'Financial & Professional Services',
      description:
        'Deliver time-sensitive transactional receipts, cryptographic OTPs, and statement updates securely on WhatsApp.',
      metrics: '99.9% delivery rate with durable asynchronous background queues.',
      benefits: [
        'Cryptographic single-use WhatsApp OTP for account login',
        'Monthly statement and payment confirmation documents',
        'KYC document submission workflows in Shared Inbox',
        'Full tenant isolation and AES-256 encrypted credential storage',
      ],
    },
  ];

  return (
    <div className="py-16 md:py-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Industry Solutions
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Tailored Workflows for Your Business Model
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Discover how organizations across retail, education, healthcare, and professional services use GreenWave to drive measurable revenue and delight customers on WhatsApp.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {verticals.map((v) => (
          <div
            key={v.title}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-brand-500/50 hover:shadow-md transition-all space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <v.icon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">{v.title}</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{v.description}</p>
              <div className="p-3 bg-brand-50/60 border border-brand-200/60 rounded-xl text-xs font-semibold text-brand-900">
                ✨ {v.metrics}
              </div>
              <div className="space-y-2 pt-2">
                {v.benefits.map((b) => (
                  <div key={b} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 pt-2"
            >
              <span>Build this workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="bg-gradient-to-tr from-brand-900 to-emerald-900 rounded-3xl p-10 sm:p-14 text-center text-white space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight">Need a custom industry workflow?</h2>
        <p className="text-brand-100 text-sm max-w-lg mx-auto">
          Our technical team helps enterprises design custom chatbot decision trees, webhook endpoints, and ERP integrations.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 bg-white text-brand-900 font-bold px-8 py-3.5 rounded-2xl shadow-lg transition-all"
        >
          <span>Speak With an Architect</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

