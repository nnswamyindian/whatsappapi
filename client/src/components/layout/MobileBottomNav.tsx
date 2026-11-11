import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  Inbox,
  Bot,
  TrendingUp,
  Settings,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const tabs = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Campaigns', to: '/campaigns', icon: Send },
    { label: 'Inbox', to: '/inbox', icon: Inbox },
    { label: 'Chatbots', to: '/chatbots', icon: Bot },
    { label: 'CRM', to: '/crm', icon: TrendingUp },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around safe-area-bottom">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-brand-700 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <tab.icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-500'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

