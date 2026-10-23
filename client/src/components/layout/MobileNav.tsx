import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Inbox, Send, Users, Menu } from 'lucide-react';

interface MobileNavProps {
  onMoreClick: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onMoreClick }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
            isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Overview</span>
      </NavLink>

      <NavLink
        to="/inbox"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
            isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <Inbox className="w-5 h-5" />
        <span>Inbox</span>
      </NavLink>

      <NavLink
        to="/campaigns"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
            isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <Send className="w-5 h-5" />
        <span>Campaigns</span>
      </NavLink>

      <NavLink
        to="/contacts"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
            isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <Users className="w-5 h-5" />
        <span>Contacts</span>
      </NavLink>

      <button
        onClick={onMoreClick}
        className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-900"
      >
        <Menu className="w-5 h-5" />
        <span>More</span>
      </button>
    </nav>
  );
};
