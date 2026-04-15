import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const URGENCY = { hot:{badge:'badge-hot'}, warm:{badge:'badge-warm'}, cold:{badge:'badge-cold'} };
const STATUS_STYLE = {
  pending:   { background:'#0c1d33', color:'#4A9EFF', border:'1px solid #172d4d' },
  sent:      { background:'transparent', color:'#404040', border:'1px solid #1e1e1e' },
  cancelled: { background:'transparent', color:'#303030', border:'1px solid #1a1a1a' },
};
const TEMPLATE_LABELS = { day1:'Day 1 — Check-in', day3:'Day 3 — Value Nudge', day7:'Day 7 — Re-engagement' };

function scheduledLabel(dt) {
  const diff = new Date(dt) - new Date();
  const days = Math.ceil(diff/(1000*60*60*24));
  if(diff<0){ const d=Math.abs(Math.floor(diff/(1000*60*60*24))); return {label:d===0?'Due today':`${d}d overdue`,overdue:true}; }
  if(days===0) return {label:'Due today',overdue:false};
  if(days===1) return {label:'Due tomorrow',overdue:false};
  return {label:`Due in ${days} days`,overdue:false};
}

const FILTERS=[{key:'pending',label:'Pending'},{key:'sent',label:'Sent'},{key:'cancelled',label:'Cancelled'},{key:'all',label:'All'}];

export default function FollowUpQueue() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('pending');

  function fetchFollowUps() {
    setLoading(true);
    api.getFollowUps(filter!=='all'?{status:filter}:{})
      .then(setFollowups).catch(console.error).finally(()=>setLoading(false));
  }
  useEffect(()=>{ fetchFollowUps(); },[filter]);

  async function handleStatus(id,s) {
    try { const u=await api.updateFollowUp(id,{status:s}); setFollowups(p=>p.map(f=>f.id===id?{...f,...u}:f)); } catch(e){console.error(e);}
  }
  async function handleProcess() {
    setProcessing(true);
    try { await api.processFollowUps(); fetchFollowUps(); } catch(e){console.error(e);} finally{setProcessing(false);}
  }

  const pendingCount = followups.filter(f=>f.status==='pending').length;
  const overdueCount = followups.filter(f=>f.status==='pending'&&new Date(f.scheduled_date)<=new Date()).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontSize:19, fontWeight:400, color:'#f2f2f2' }}>Follow-up Queue</h1>
          <p style={{ fontSize:11, color:'#404040', marginTop:3 }}>Day 1, 3, and 7 follow-ups scheduled automatically per lead</p>
        </div>
        <button onClick={handleProcess} disabled={processing} className="btn-dim flex items-center gap-2"
          style={{ opacity:processing?0.6:1 }}>
          {processing
            ? <><div className="w-3.5 h-3.5 border border-t-transparent animate-spin" style={{ borderColor:'#4A9EFF', borderTopColor:'transparent' }} />Processing...</>
            : 'Process Due Now'}
        </button>
      </div>

      {overdueCount>0 && (
        <div className="mb-4 px-4 py-3 flex items-center gap-3"
          style={{ background:'rgba(74,158,255,0.04)', border:'1px solid rgba(74,158,255,0.15)', borderLeft:'2px solid #4A9EFF' }}>
          <p style={{ fontSize:12, fontWeight:500, color:'#4A9EFF' }}>{overdueCount} follow-up{overdueCount!==1?'s':''} overdue</p>
          <p style={{ fontSize:11, color:'#484848' }}>Click "Process Due Now" to send via Ava</p>
        </div>
      )}

      <div className="flex mb-5" style={{ border:'1px solid #1e1e1e', width:'fit-content' }}>
        {FILTERS.map(({key,label}) => (
          <button key={key} onClick={()=>setFilter(key)}
            style={{
              padding:'6px 12px', fontSize:10, fontWeight:500, letterSpacing:'0.06em',
              textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s',
              background: filter===key ? '#4A9EFF' : 'transparent',
              color: filter===key ? '#000' : '#484848',
              borderRight: key!=='all' ? '1px solid #1e1e1e' : 'none', border:'none',
              borderRight: key!=='all' ? '1px solid #1e1e1e' : 'none',
            }}>
            {label}
            {key==='pending'&&pendingCount>0 && (
              <span style={{ marginLeft:5, fontSize:9, fontWeight:700, padding:'0 4px',
                background: filter===key ? 'rgba(0,0,0,0.2)':'#4A9EFF', color:'#000' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-4 h-4 border border-t-transparent animate-spin" style={{ borderColor:'#4A9EFF', borderTopColor:'transparent' }} />
        </div>
      ) : followups.length===0 ? (
        <div className="card text-center py-16">
          <p style={{ fontWeight:500, color:'#d8d8d8' }}>No follow-ups in this category</p>
          <p style={{ fontSize:11, color:'#404040', marginTop:4 }}>New leads get Day 1, 3, and 7 follow-ups automatically</p>
        </div>
      ) : (
        <div className="card">
          {followups.map((f,i) => {
            const urg = URGENCY[f.lead_urgency]||URGENCY.cold;
            const ss  = STATUS_STYLE[f.status]||STATUS_STYLE.pending;
            const di  = scheduledLabel(f.scheduled_date);
            return (
              <div key={f.id} className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i<followups.length-1 ? '1px solid #161616' : 'none' }}
                onMouseEnter={e=>e.currentTarget.style.background='#141414'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: f.lead_urgency==='hot'?'#4A9EFF':f.lead_urgency==='warm'?'#484848':'#2a2a2a' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p style={{ fontSize:13, fontWeight:500, color:'#d8d8d8' }}>{f.lead_name}</p>
                    <span className={urg.badge}>{f.lead_urgency.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize:11, color:'#404040', marginTop:2 }}>{TEMPLATE_LABELS[f.message_template]||f.message_template}</p>
                  {f.lead_phone && <p style={{ fontSize:10, color:'#303030' }}>{f.lead_phone}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p style={{ fontSize:11, fontWeight:500, color: di.overdue?'#4A9EFF':'#484848' }}>{di.label}</p>
                  <p style={{ fontSize:10, color:'#303030', marginTop:1 }}>{new Date(f.scheduled_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium px-2 py-1" style={ss}>{f.status.charAt(0).toUpperCase()+f.status.slice(1)}</span>
                  {f.status==='pending' && (<>
                    <button onClick={()=>handleStatus(f.id,'sent')} className="px-2 py-1 text-xs font-medium"
                      style={{ background:'#0c1d33', color:'#4A9EFF', border:'1px solid #172d4d', cursor:'pointer' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#0f2540'}
                      onMouseLeave={e=>e.currentTarget.style.background='#0c1d33'}>Mark Sent</button>
                    <button onClick={()=>handleStatus(f.id,'cancelled')} className="btn-ghost">Cancel</button>
                  </>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
