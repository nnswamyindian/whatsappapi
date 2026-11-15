import React, { useState } from 'react';
import { Mail, MapPin, Send, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-16 md:py-24 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Get in Touch
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Contact Digi8 Solutions
        </h1>
        <p className="text-base text-slate-600">
          Have technical questions about Meta WhatsApp Cloud API integration, enterprise volume licensing, or custom solutions? Reach out to the <strong>MetaGreenWave</strong> team at Digi8 Solutions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
        {/* Contact Info */}
        <div className="space-y-8 bg-slate-50 p-8 sm:p-10 rounded-3xl border border-slate-200 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Direct Business Contacts</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We respond to all customer and compliance inquiries within 1 business day. Existing customers can also submit tickets directly inside the workspace dashboard.
            </p>

            <div className="space-y-4 pt-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">General, Support & Privacy Email</span>
                  <a href="mailto:hello@digi8solutions.com" className="font-bold text-slate-900 hover:text-brand-600">
                    hello@digi8solutions.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Operating Entity</span>
                  <strong className="text-slate-900">Digi8 Solutions</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Operations</span>
                  <strong className="text-slate-900">Digital Software & Cloud Messaging Solutions</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-brand-100/60 rounded-2xl border border-brand-200 text-xs text-brand-900 font-medium">
            💡 For compliance inquiries or User Data Deletion tracking, visit our public <a href="/data-deletion" className="underline font-bold">Data Deletion Portal</a>.
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-brand-600 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">Message Received!</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Thank you for contacting Digi8 Solutions. Our team will review your message and reply via email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@company.com"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Corp"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can Digi8 Solutions assist your WhatsApp business communication?"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Send className="w-4 h-4" />
                <span>Send Message to Digi8 Solutions</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
