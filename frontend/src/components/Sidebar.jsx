import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/',              label: 'Dashboard'     },
  { to: '/leads',         label: 'Leads'         },
  { to: '/conversations', label: 'Conversations' },
  { to: '/appointments',  label: 'Appointments'  },
  { to: '/followups',     label: 'Follow-ups'    },
];

export default function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-surface-950 border-r border-surface-800 flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6 border-b border-surface-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-accent-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold tracking-tight">AVA</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-surface-100 leading-tight tracking-tight">Ava</div>
            <div className="text-xs text-surface-500 leading-tight">AI Realtor Assistant</div>
          </div>
        </div>
        <div className="mt-4 px-2.5 py-1.5 bg-surface-800 rounded border border-surface-700">
          <p className="text-xs text-surface-400">
            <span className="text-accent-400 font-medium">Ayoub</span>
            {' '}· Orlando & Florida Coast
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-surface-700 text-surface-100'
                  : 'text-surface-500 hover:bg-surface-800 hover:text-surface-300'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Chat widget link */}
      <div className="px-4 pb-6">
        <a
          href="/chat"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center w-full py-2 rounded border border-surface-700 text-surface-400 hover:bg-surface-800 hover:text-surface-200 text-xs font-medium transition-colors tracking-wide uppercase"
        >
          Open Chat Widget
        </a>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <p className="text-xs text-surface-600">Ava online</p>
        </div>
      </div>
    </aside>
  );
}
