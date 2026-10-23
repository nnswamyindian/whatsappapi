import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Send,
  FileCode2,
  Users,
  UserCheck,
  Inbox,
  GitBranch,
  KeyRound,
  BarChart3,
  CreditCard,
  UsersRound,
  Settings,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Campaigns', to: '/campaigns', icon: Send },
    { label: 'Templates', to: '/templates', icon: FileCode2 },
    { label: 'Contacts', to: '/contacts', icon: Users },
    { label: 'Audiences', to: '/audiences', icon: UserCheck },
    { label: 'Shared Inbox', to: '/inbox', icon: Inbox },
    { label: 'Automations', to: '/automations', icon: GitBranch },
    { label: 'API & Integrations', to: '/integrations', icon: KeyRound },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Billing & Usage', to: '/billing', icon: CreditCard },
    { label: 'Team & Permissions', to: '/team', icon: UsersRound },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="py-4 px-3 overflow-y-auto flex-1 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Operations
          </div>
          {navItems.slice(0, 7).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-900 font-bold border border-brand-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4 text-brand-700 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="px-3 pt-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Management & System
          </div>
          {navItems.slice(7).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-900 font-bold border border-brand-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4 text-brand-700 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user?.isPlatformAdmin && (
            <div className="pt-2">
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`
                }
              >
                <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Platform Admin</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Sidebar Footer: WhatsApp Meta Version badge */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Meta Graph API</span>
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold">
              v21.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
