import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  ChevronDown,
  Wallet,
  ShieldCheck,
  Building2,
  LogOut,
  User,
  PlusCircle,
  Menu,
  Bell,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { api } from '../../services/api';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  onOpenTopupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle, onOpenTopupModal }) => {
  const { user, activeOrg, organizations, switchOrganization, logout } = useAuth();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    api.get('/notifications/unread-count')
      .then((res) => setUnreadNotifications(res.unreadCount || 0))
      .catch(() => {});
  }, [activeOrg?.id]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center px-4 md:px-6 justify-between">
      {/* Click outside backdrop for dropdowns */}
      {(orgDropdownOpen || userDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setOrgDropdownOpen(false);
            setUserDropdownOpen(false);
          }}
        />
      )}

      {/* Left side: Mobile menu toggle & Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-900 to-brand-600 flex items-center justify-center text-white shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">GreenWave</span>
              <ShieldCheck className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:block">WhatsApp Business SaaS</span>
          </div>
        </Link>

        {/* Workspace Switcher Dropdown */}
        <div className="relative ml-2 sm:ml-4 z-50">
          <button
            onClick={() => {
              setOrgDropdownOpen(!orgDropdownOpen);
              setUserDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors border border-slate-200"
          >
            <Building2 className="w-3.5 h-3.5 text-brand-700" />
            <span className="max-w-[120px] truncate">{activeOrg?.name || 'Workspace'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {orgDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Your Workspaces
              </div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrganization(org.id);
                    setOrgDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-brand-50 ${
                    org.id === activeOrg?.id ? 'text-brand-900 font-bold bg-brand-50/50' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === activeOrg?.id && (
                    <span className="text-[10px] bg-brand-200 text-brand-900 px-1.5 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  )}
                </button>
              ))}
              <div className="border-t border-slate-100 mt-1 pt-1">
                <Link
                  to="/settings"
                  onClick={() => setOrgDropdownOpen(false)}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-brand-700 hover:bg-slate-50 font-medium"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create or Manage Workspaces</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Wallet, Mode badge, User Profile */}
      <div className="flex items-center gap-3">
        {/* Wallet Balance Widget */}
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
          <Wallet className="w-3.5 h-3.5 text-brand-700" />
          <span className="text-slate-600 font-medium">Wallet:</span>
          <span className="font-bold text-brand-900">
            ${(activeOrg?.wallet_balance || 0).toFixed(2)}
          </span>
          <button
            onClick={onOpenTopupModal}
            className="ml-1 text-[11px] text-brand-700 hover:text-brand-900 underline font-semibold"
          >
            + Top Up
          </button>
        </div>

        {/* Onboarding Checklist Link */}
        <Link
          to="/onboarding"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 rounded-lg text-xs font-bold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Onboarding</span>
        </Link>

        {/* Notification Bell */}
        <button
          onClick={() => setNotificationDrawerOpen(true)}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-brand-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative z-50">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setOrgDropdownOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 border border-brand-300 flex items-center justify-center font-bold text-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-tight">{user?.fullName || 'Agent'}</div>
              <div className="text-[10px] text-slate-500 capitalize">{activeOrg?.role || 'Member'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-100 text-xs">
                <div className="font-semibold text-slate-800 truncate">{user?.fullName}</div>
                <div className="text-slate-500 text-[11px] truncate">{user?.email}</div>
              </div>
              <Link
                to="/settings"
                onClick={() => setUserDropdownOpen(false)}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-700 hover:bg-slate-50"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Settings</span>
              </Link>
              {user?.isPlatformAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setUserDropdownOpen(false)}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-purple-700 hover:bg-purple-50 font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Platform Admin</span>
                </Link>
              )}
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        onUpdateUnreadCount={(count) => setUnreadNotifications(count)}
      />
    </header>
  );
};
