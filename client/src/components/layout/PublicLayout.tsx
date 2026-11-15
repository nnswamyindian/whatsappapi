import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  MessageSquare,
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  Globe,
  ExternalLink,
  Activity,
  Lock,
} from 'lucide-react';

export const PublicLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', to: '/features' },
    { label: 'Solutions', to: '/solutions' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Security', to: '/security' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 text-center font-medium border-b border-slate-800">
        <span>⚡ MetaGreenWave by Digi8 Solutions &bull; Official WhatsApp Business Platform Cloud API Integration</span>
      </div>

      {/* Main Public Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-900 to-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/20 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">MetaGreenWave</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200">
                  by Digi8 Solutions
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-0.5">WhatsApp Business Messaging SaaS Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${
                    isActive ? 'text-brand-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-bold text-slate-700 hover:text-brand-700 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 animate-fade-in shadow-xl">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-900 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl shadow-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>

      {/* Global Public Footer */}
      <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-extrabold text-white tracking-tight block">MetaGreenWave</span>
                  <span className="text-xs text-slate-400">Operated by Digi8 Solutions</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Production-oriented WhatsApp Business Messaging SaaS platform. Engineered for campaign orchestration, shared team inboxes, no-code chatbots, and CRM sales pipelines via official Meta Cloud API.
              </p>
              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <p>Support & Privacy: <a href="mailto:hello@digi8solutions.com" className="text-slate-300 hover:underline">hello@digi8solutions.com</a></p>
                <p><Link to="/status" className="text-emerald-400 hover:underline flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>All Systems Operational &bull; Status Page</Link></p>
              </div>
            </div>

            {/* Platform column */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link to="/features" className="hover:text-white transition-colors">Campaign Engine</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">Shared Team Inbox</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">Chatbot Studio</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">Workflow Automation</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">WhatsApp CRM</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security Architecture</Link></li>
              </ul>
            </div>

            {/* Solutions column */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Solutions</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link to="/solutions" className="hover:text-white transition-colors">Retail & E-commerce</Link></li>
                <li><Link to="/solutions" className="hover:text-white transition-colors">Education & Academies</Link></li>
                <li><Link to="/solutions" className="hover:text-white transition-colors">Healthcare & Clinics</Link></li>
                <li><Link to="/solutions" className="hover:text-white transition-colors">Real Estate Agencies</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Plans & Pricing</Link></li>
                <li><Link to="/status" className="hover:text-white transition-colors">System Status</Link></li>
              </ul>
            </div>

            {/* Legal & Trust column */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Trust & Compliance</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/data-deletion" className="hover:text-white transition-colors font-semibold text-brand-400">Data Deletion Portal</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link to="/acceptable-use" className="hover:text-white transition-colors">Acceptable Use Policy</Link></li>
                <li><Link to="/cancellation-refund" className="hover:text-white transition-colors">Refund & Cancellation</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              </ul>
            </div>
          </div>

          {/* Compliance & Trademark Disclaimer */}
          <div className="mt-12 pt-8 border-t border-slate-900 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p className="max-w-2xl">
              &copy; {new Date().getFullYear()} Digi8 Solutions. All rights reserved. MetaGreenWave by Digi8 Solutions is an independent software application that integrates with the official WhatsApp Business Platform Cloud API provided by Meta Platforms, Inc. WhatsApp and Meta are registered trademarks of Meta Platforms, Inc.
            </p>
            <div className="flex items-center gap-4 text-slate-400 shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                <span>AES-256-GCM Encrypted</span>
              </span>
              <span>&bull;</span>
              <span>DPDPA & GDPR Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
