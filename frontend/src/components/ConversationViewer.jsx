import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';

const URGENCY_CONFIG = {
  hot:  { badge: 'badge-hot'  },
  warm: { badge: 'badge-warm' },
  cold: { badge: 'badge-cold' },
};

function formatTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function LeadSidebar({ leads, selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = leads.filter((l) =>
    !search || l.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="w-60 flex-shrink-0 border-r border-surface-700 bg-surface-900 flex flex-col">
      <div className="p-3 border-b border-surface-700">
        <input
          type="text"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-surface-800 border border-surface-700 rounded text-surface-200 placeholder-surface-600 focus:outline-none focus:border-surface-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-surface-600 text-sm py-6">No leads found</p>
        )}
        {filtered.map((lead) => {
          const cfg = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.cold;
          return (
            <button
              key={lead.id}
              onClick={() => onSelect(lead.id)}
              className={`w-full text-left px-3 py-3 border-b border-surface-800 hover:bg-surface-700/50 transition-colors ${
                lead.id === selectedId ? 'bg-surface-700 border-l-2 border-l-accent-500' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-surface-700 border border-surface-600 flex items-center justify-center text-surface-300 font-semibold text-xs shrink-0">
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-200 truncate">{lead.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cfg.badge + ' text-xs'}>{lead.urgency}</span>
                    {lead.escalation_ready ? <span className="text-xs text-red-400">escalated</span> : null}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConversationPane({ lead, messages }) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!lead) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-900">
        <p className="text-surface-600 text-sm">Select a lead to view their conversation</p>
      </div>
    );
  }

  const cfg = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.cold;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Info bar */}
      <div className="px-5 py-3 bg-surface-800 border-b border-surface-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-surface-700 border border-surface-600 flex items-center justify-center text-surface-300 font-semibold text-sm">
          {lead.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-surface-100 text-sm">{lead.name}</p>
            <span className={cfg.badge}>{lead.urgency}</span>
            {lead.escalation_ready === 1 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                Escalation Ready
              </span>
            )}
          </div>
          <p className="text-xs text-surface-500 mt-0.5">
            {lead.phone || lead.email || 'No contact'}
            {lead.area ? ` · ${lead.area}` : ''}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-surface-500">
          {lead.budget   && <span>{lead.budget}</span>}
          {lead.timeline && <span>{lead.timeline}</span>}
          {lead.intent && lead.intent !== 'unknown' && <span className="capitalize">{lead.intent}</span>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-surface-900">
        {messages.length === 0 && (
          <p className="text-center text-surface-600 py-8 text-sm">No messages yet.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-0.5">
                A
              </div>
            )}
            <div className="max-w-[70%]">
              <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}>
                {msg.message}
              </div>
              <p className={`text-xs text-surface-600 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {msg.role === 'user' ? lead.name : 'Ava'} · {formatTime(msg.created_at)}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded bg-surface-600 flex items-center justify-center text-surface-200 text-xs font-bold shrink-0 mb-0.5">
                {lead.name.charAt(0)}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="px-5 py-3 bg-surface-800 border-t border-surface-700 border-l-2 border-l-accent-500">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-1">Ava's Notes for Ayoub</p>
          <p className="text-sm text-surface-300">{lead.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function ConversationViewer({ leadId, onSelectLead }) {
  const [leads, setLeads]           = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);

  useEffect(() => {
    api.getLeads().then(setLeads).catch(console.error).finally(() => setLoadingLeads(false));
  }, []);

  useEffect(() => {
    if (leadId && leads.length > 0) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) selectLead(leadId);
    }
  }, [leadId, leads]);

  function selectLead(id) {
    onSelectLead(id);
    const lead = leads.find((l) => l.id === id);
    setSelectedLead(lead || null);
    setLoadingMsgs(true);
    api.getConversation(id).then(setMessages).catch(console.error).finally(() => setLoadingMsgs(false));
  }

  return (
    <div className="flex h-full bg-surface-900">
      {loadingLeads ? (
        <div className="w-60 flex items-center justify-center border-r border-surface-700">
          <div className="w-5 h-5 border border-surface-600 border-t-surface-300 rounded-full animate-spin" />
        </div>
      ) : (
        <LeadSidebar leads={leads} selectedId={leadId} onSelect={selectLead} />
      )}
      {loadingMsgs ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border border-surface-600 border-t-surface-300 rounded-full animate-spin" />
        </div>
      ) : (
        <ConversationPane lead={selectedLead} messages={messages} />
      )}
    </div>
  );
}
