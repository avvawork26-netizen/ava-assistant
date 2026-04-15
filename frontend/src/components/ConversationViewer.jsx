import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';

const URGENCY = { hot:{badge:'badge-hot'}, warm:{badge:'badge-warm'}, cold:{badge:'badge-cold'} };

function formatTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true});
}

function LeadSidebar({ leads, selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = leads.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="w-60 flex-shrink-0 flex flex-col" style={{ borderRight:'1px solid #1e1e1e', background:'#0d0d0d' }}>
      <div className="p-3" style={{ borderBottom:'1px solid #1e1e1e' }}>
        <input type="text" placeholder="Search leads..." value={search}
          onChange={e => setSearch(e.target.value)} className="input" style={{ fontSize:11, padding:'6px 10px' }} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && <p className="text-center py-6" style={{ fontSize:11, color:'#404040' }}>No leads found</p>}
        {filtered.map(lead => {
          const sel = lead.id === selectedId;
          return (
            <button key={lead.id} onClick={() => onSelect(lead.id)} className="w-full text-left px-3 py-3"
              style={{
                borderBottom:'1px solid #161616',
                borderLeft: sel ? '2px solid #4A9EFF' : '2px solid transparent',
                background: sel ? 'rgba(74,158,255,0.05)' : 'transparent',
              }}
              onMouseEnter={e => { if(!sel) e.currentTarget.style.background='#141414'; }}
              onMouseLeave={e => { if(!sel) e.currentTarget.style.background='transparent'; }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 flex items-center justify-center text-xs shrink-0"
                  style={{ background:'#191919', border:'1px solid #252525', color:'#585858', fontWeight:500 }}>
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize:12, fontWeight:500, color:'#d8d8d8' }}>{lead.name}</p>
                  <p style={{ fontSize:10, color:'#404040', marginTop:1 }}>
                    {lead.urgency}{lead.escalation_ready ? ' · Escalated' : ''}
                  </p>
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
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  if (!lead) return (
    <div className="flex-1 flex items-center justify-center" style={{ background:'#080808' }}>
      <div className="text-center">
        <p style={{ fontWeight:500, color:'#d8d8d8' }}>Select a lead</p>
        <p style={{ fontSize:11, color:'#404040', marginTop:4 }}>Choose a lead from the left to view conversation</p>
      </div>
    </div>
  );

  const urg = URGENCY[lead.urgency]||URGENCY.cold;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-3 flex items-center gap-3" style={{ background:'#0d0d0d', borderBottom:'1px solid #1e1e1e' }}>
        <div className="w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background:'#191919', border:'1px solid #252525', color:'#585858' }}>
          {lead.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p style={{ fontWeight:500, color:'#d8d8d8' }}>{lead.name}</p>
            <span className={urg.badge}>{lead.urgency.toUpperCase()}</span>
            {lead.escalation_ready===1 && (
              <span style={{ fontSize:10, padding:'1px 7px', background:'#0c1d33', color:'#4A9EFF', border:'1px solid #172d4d' }}>Escalation Ready</span>
            )}
          </div>
          <p style={{ fontSize:11, color:'#404040', marginTop:2 }}>
            {lead.phone||lead.email||'No contact'}{lead.area ? ` · ${lead.area}` : ''}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4" style={{ color:'#484848', fontSize:11 }}>
          {lead.budget && <span>{lead.budget}</span>}
          {lead.timeline && <span>{lead.timeline}</span>}
          {lead.intent && lead.intent!=='unknown' && <span className="capitalize">{lead.intent}</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background:'#080808' }}>
        {messages.length===0 && <p className="text-center py-8" style={{ fontSize:11, color:'#404040' }}>No messages yet.</p>}
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.role==='user'?'justify-end':'justify-start'}`}>
            {msg.role==='assistant' && (
              <div className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mb-0.5"
                style={{ background:'#0c1d33', color:'#4A9EFF' }}>A</div>
            )}
            <div className="max-w-[70%]">
              <div className={msg.role==='user'?'bubble-user':'bubble-assistant'}>{msg.message}</div>
              <p className={`text-xs mt-1 ${msg.role==='user'?'text-right':''}`} style={{ fontSize:10, color:'#404040' }}>
                {msg.role==='user'?lead.name:'Ava'} · {formatTime(msg.created_at)}
              </p>
            </div>
            {msg.role==='user' && (
              <div className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mb-0.5"
                style={{ background:'#191919', color:'#585858' }}>{lead.name.charAt(0)}</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {lead.notes && (
        <div className="px-5 py-3" style={{ borderTop:'1px solid #1e1e1e', borderLeft:'2px solid #4A9EFF', background:'#0d0d0d' }}>
          <p className="label mb-1">Ava's Notes for Ayoub</p>
          <p style={{ fontSize:12, color:'#484848', fontStyle:'italic' }}>{lead.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function ConversationViewer({ leadId, onSelectLead }) {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => { api.getLeads().then(setLeads).catch(console.error).finally(() => setLoadingLeads(false)); }, []);

  useEffect(() => {
    if (leadId && leads.length > 0) { const l = leads.find(x => x.id===leadId); if(l) selectLead(leadId); }
  }, [leadId, leads]);

  function selectLead(id) {
    onSelectLead(id);
    setSelectedLead(leads.find(l => l.id===id)||null);
    setLoadingMsgs(true);
    api.getConversation(id).then(setMessages).catch(console.error).finally(() => setLoadingMsgs(false));
  }

  const spinner = <div className="w-4 h-4 border border-t-transparent animate-spin" style={{ borderColor:'#4A9EFF', borderTopColor:'transparent' }} />;

  return (
    <div className="flex h-full">
      {loadingLeads
        ? <div className="w-60 flex items-center justify-center" style={{ borderRight:'1px solid #1e1e1e' }}>{spinner}</div>
        : <LeadSidebar leads={leads} selectedId={leadId} onSelect={selectLead} />
      }
      {loadingMsgs
        ? <div className="flex-1 flex items-center justify-center" style={{ background:'#080808' }}>{spinner}</div>
        : <ConversationPane lead={selectedLead} messages={messages} />
      }
    </div>
  );
}
