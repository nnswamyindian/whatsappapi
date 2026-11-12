import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { WhatsAppConnection } from '../../types';
import { Info, Sparkles, X, CreditCard } from 'lucide-react';

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [topupAmount, setTopupAmount] = useState('25');
  const [topupLoading, setTopupLoading] = useState(false);
  const { activeOrg, refreshOrg } = useAuth();

  useEffect(() => {
    api.get<WhatsAppConnection>('/whatsapp/status')
      .then(setConnection)
      .catch(() => {});
  }, [activeOrg?.id]);

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupLoading(true);
    try {
      await api.post('/billing/topup', { amountUsd: parseFloat(topupAmount) });
      await refreshOrg();
      setTopupModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Top-up failed');
    } finally {
      setTopupLoading(false);
    }
  };

  const isSandbox = connection?.mode === 'sandbox';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      {/* Top Navbar */}
      <Navbar
        onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onOpenTopupModal={() => setTopupModalOpen(true)}
      />

      {/* Labelled Sandbox Mode Banner */}
      {isSandbox && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 sm:px-4 py-2 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 w-full overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px] sm:text-xs leading-tight break-words">
              <strong>Sandbox Testing Mode Active:</strong> WhatsApp message deliveries and approvals are simulated with zero Meta charges.
            </span>
          </div>
          <Link
            to="/integrations"
            className="font-bold text-amber-800 underline hover:text-amber-950 text-[11px] sm:text-xs self-start sm:self-auto shrink-0"
          >
            Connect Live Cloud API &rarr;
          </Link>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto pb-16 md:pb-6 overflow-x-hidden">
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden">
          {children || <Outlet />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onMoreClick={() => setMobileSidebarOpen(true)} />

      {/* Quick Wallet Top-Up Modal */}
      {topupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Top Up Messaging Wallet</h3>
                  <p className="text-xs text-slate-500">Add prepaid balance for WhatsApp campaigns</p>
                </div>
              </div>
              <button
                onClick={() => setTopupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopupSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select or Enter Amount (USD)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['25', '50', '100'].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        topupAmount === amt
                          ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ${amt}.00
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">$</span>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-semibold text-slate-900">${(activeOrg?.wallet_balance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Balance After Top-Up:</span>
                  <span className="font-bold text-brand-800">
                    ${((activeOrg?.wallet_balance || 0) + (parseFloat(topupAmount) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTopupModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topupLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg shadow-sm"
                >
                  {topupLoading ? 'Processing...' : `Confirm +$${topupAmount}.00`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
