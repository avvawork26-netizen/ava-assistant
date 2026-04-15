import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const URGENCY = { hot:{badge:'badge-hot'}, warm:{badge:'badge-warm'}, cold:{badge:'badge-cold'} };
const INTENT  = { buy:{label:'Buyer',cls:'badge-buy'}, sell:{label:'Seller',cls:'badge-sell'}, rent:{label:'Renter',cls:'badge-rent'}, invest:{label:'Investor',cls:'badge-invest'}, unknown:{label:'—',cls:'badge-unknown'} };

const STATUS_STYLE = {
  new:      { background:'transparent', color:'#484848', border:'1px solid #1e1e1e' },
  active:   { background:'#0c1d33', color:'#4A9EFF', border:'1px solid #172d4d' },
  escalated:{ background:'#0c1d33', color:'#4A9EFF', border:'1px solid #172d4d' },
  closed:   { background:'transparent', color:'#303030', border:'1px solid #1a1a1a' },
};

const FILTERS = [
  {key:'all',label:'All'},{key:'hot',label:'Hot'},{key:'warm',label:'Warm'},
  {key:'cold',label:'Cold'},{key:'escalated',label:'Escalated'},
];

export default function LeadList({ selectedLeadId, onSelectLead }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const p = {};
    if (filter === 'escalated') p.escalation_ready = 'true';
    else if (filter !== 'all') p.urgency = filter;
    api.getLeads(p).then(setLeads).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = leads.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.email||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone||'').includes(search) || (l.area||'').toLowerCase().includes(search.toLowerCase())
  );

  async function handleStatus(lead, s) {
    try { const u = await api.updateLead(lead.id,{status:s}); setLeads(p => p.map(l => l.id===lead.id?u:l)); }
    catch(e){ console.error(e); }
  }

  function goConvo(id) { onSelectLead(id); navigate('/conversations'); }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize:19, fontWeight:400, color:'#f2f2f2' }}>Leads</h1>
          <p style={{ fontSize:11, color:'#404040', marginTop:3 }}>{leads.length} total</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex" style={{ border:'1px solid #1e1e1e' }}>
          {FILTERS.map(({key,label}) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                padding:'6px 12px', fontSize:10, fontWeight:500, letterSpacing:'0.06em',
                textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s',
                background: filter===key ? '#4A9EFF' : 'transparent',
                color: filter===key ? '#000' : '#484848',
                borderRight:'1px solid #1e1e1e', border:'none',
                borderRight: key!=='escalated' ? '1px solid #1e1e1e' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search by name, email, area..." value={search}
          onChange={e => setSearch(e.target.value)} className="input flex-1" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-4 h-4 border border-t-transparent animate-spin" style={{ borderColor:'#4A9EFF', borderTopColor:'transparent' }} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ fontWeight:500, color:'#d8d8d8' }}>No leads found</p>
              <p style={{ fontSize:11, color:'#404040', marginTop:4 }}>Adjust filters or search</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ background:'#0d0d0d', borderBottom:'1px solid #1e1e1e' }}>
                <tr>
                  {['Lead','Intent','Budget','Area','Timeline','Urgency','Status',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead,i) => {
                  const urg = URGENCY[lead.urgency]||URGENCY.cold;
                  const int = INTENT[lead.intent]||INTENT.unknown;
                  const sel = lead.id === selectedLeadId;
                  return (
                    <tr key={lead.id} style={{
                      borderBottom: i<filtered.length-1 ? '1px solid #161616' : 'none',
                      background: sel ? 'rgba(74,158,255,0.04)' : 'transparent',
                      borderLeft: sel ? '2px solid #4A9EFF' : '2px solid transparent',
                    }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {lead.escalation_ready===1 && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background:'#4A9EFF' }} />}
                          <div>
                            <p style={{ fontSize:13, fontWeight:500, color:'#d8d8d8' }}>{lead.name}</p>
                            <p style={{ fontSize:11, color:'#404040', marginTop:1 }}>{lead.phone||lead.email||'No contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={int.cls}>{int.label}</span></td>
                      <td className="px-4 py-3" style={{ fontSize:12, color:'#484848' }}>{lead.budget||'—'}</td>
                      <td className="px-4 py-3 max-w-[140px] truncate" style={{ fontSize:12, color:'#484848' }}>{lead.area||'—'}</td>
                      <td className="px-4 py-3" style={{ fontSize:12, color:'#484848' }}>{lead.timeline||'—'}</td>
                      <td className="px-4 py-3"><span className={urg.badge}>{(lead.urgency||'cold').toUpperCase()}</span></td>
                      <td className="px-4 py-3">
                        <select value={lead.status} onChange={e => handleStatus(lead,e.target.value)}
                          className="text-xs font-medium px-2 py-1 cursor-pointer"
                          style={{ ...(STATUS_STYLE[lead.status]||STATUS_STYLE.active), outline:'none' }}>
                          {['new','active','escalated','closed'].map(s => (
                            <option key={s} value={s} style={{ background:'#111111', color:'#d8d8d8' }}>
                              {s.charAt(0).toUpperCase()+s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => goConvo(lead.id)} className="btn-ghost">Chat</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
