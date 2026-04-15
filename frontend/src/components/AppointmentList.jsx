import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const TYPE_LABELS = { consultation:'Consultation', showing:'Showing', follow_up:'Follow-up' };
const STATUS_STYLE = {
  scheduled: { background:'#0c1d33', color:'#4A9EFF', border:'1px solid #172d4d' },
  completed: { background:'transparent', color:'#404040', border:'1px solid #1e1e1e' },
  cancelled: { background:'transparent', color:'#303030', border:'1px solid #1a1a1a' },
};

function formatDate(d) {
  return new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
}
function formatTime(t) {
  const [h,m] = t.split(':'); const hr=parseInt(h);
  return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`;
}
function groupByDate(appts) {
  const g={};
  appts.forEach(a => { if(!g[a.date]) g[a.date]=[]; g[a.date].push(a); });
  return Object.entries(g).sort(([a],[b]) => a.localeCompare(b));
}

const FILTERS=[{key:'upcoming',label:'Upcoming'},{key:'today',label:'Today'},{key:'all',label:'All'}];

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => { api.getAppointments().then(setAppointments).catch(console.error).finally(()=>setLoading(false)); },[]);

  async function handleStatus(id, s) {
    try { const u=await api.updateAppointment(id,{status:s}); setAppointments(p=>p.map(a=>a.id===id?u:a)); } catch(e){console.error(e);}
  }
  async function handleDelete(id) {
    if(!window.confirm('Delete this appointment?')) return;
    try { await api.deleteAppointment(id); setAppointments(p=>p.filter(a=>a.id!==id)); } catch(e){console.error(e);}
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const filtered = appointments.filter(a => {
    if(filter==='today') return a.date===todayStr;
    if(filter==='upcoming') return a.date>=todayStr && a.status==='scheduled';
    return true;
  });
  const grouped = groupByDate(filtered);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 style={{ fontSize:19, fontWeight:400, color:'#f2f2f2' }}>Appointments</h1>
        <p style={{ fontSize:11, color:'#404040', marginTop:3 }}>Mon–Fri · 9am–5pm EST</p>
      </div>

      <div className="flex mb-5" style={{ border:'1px solid #1e1e1e', width:'fit-content' }}>
        {FILTERS.map(({key,label}) => (
          <button key={key} onClick={()=>setFilter(key)}
            style={{
              padding:'6px 14px', fontSize:10, fontWeight:500, letterSpacing:'0.06em',
              textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s',
              background: filter===key ? '#4A9EFF' : 'transparent',
              color: filter===key ? '#000' : '#484848',
              borderRight: key!=='all' ? '1px solid #1e1e1e' : 'none', border:'none',
              borderRight: key!=='all' ? '1px solid #1e1e1e' : 'none',
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-4 h-4 border border-t-transparent animate-spin" style={{ borderColor:'#4A9EFF', borderTopColor:'transparent' }} />
        </div>
      ) : grouped.length===0 ? (
        <div className="card text-center py-16">
          <p style={{ fontWeight:500, color:'#d8d8d8' }}>No appointments found</p>
          <p style={{ fontSize:11, color:'#404040', marginTop:4 }}>Ava will book appointments when leads are ready</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date,appts]) => {
            const isToday = date===todayStr;
            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 style={{ fontSize:9, fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color: isToday ? '#4A9EFF' : '#404040' }}>
                    {isToday?'Today — ':''}{formatDate(date).toUpperCase()}
                  </h2>
                  <div className="flex-1 h-px" style={{ background:'#161616' }} />
                  <span style={{ fontSize:10, color:'#303030' }}>{appts.length} appt{appts.length!==1?'s':''}</span>
                </div>
                <div className="card">
                  {appts.map((appt,i) => {
                    const ss = STATUS_STYLE[appt.status]||STATUS_STYLE.scheduled;
                    return (
                      <div key={appt.id} className="flex items-center gap-4 px-5 py-4"
                        style={{ borderBottom: i<appts.length-1 ? '1px solid #161616' : 'none' }}>
                        <div style={{ width:64, flexShrink:0, textAlign:'right' }}>
                          <p style={{ fontWeight:500, color:'#4A9EFF', fontSize:10 }}>{formatTime(appt.time)}</p>
                        </div>
                        <div className="w-px h-8 shrink-0" style={{ background:'#1e1e1e' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ fontWeight:500, color:'#d8d8d8' }}>{appt.lead_name}</p>
                            <span style={{ fontSize:9, padding:'1px 7px', letterSpacing:'0.08em', textTransform:'uppercase', background:'#0c1d33', color:'#4A9EFF', border:'1px solid #172d4d' }}>
                              {(TYPE_LABELS[appt.type]||'Consultation').toUpperCase()}
                            </span>
                          </div>
                          {appt.lead_phone && <p style={{ fontSize:11, color:'#404040', marginTop:2 }}>{appt.lead_phone}</p>}
                          {appt.notes && <p style={{ fontSize:11, color:'#484848', marginTop:2, fontStyle:'italic' }} className="truncate">{appt.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select value={appt.status} onChange={e=>handleStatus(appt.id,e.target.value)}
                            className="text-xs font-medium px-2 py-1 cursor-pointer"
                            style={{ ...ss, outline:'none' }}>
                            {['scheduled','completed','cancelled'].map(s=>(
                              <option key={s} value={s} style={{ background:'#111111', color:'#d8d8d8' }}>
                                {s.charAt(0).toUpperCase()+s.slice(1)}
                              </option>
                            ))}
                          </select>
                          <button onClick={()=>handleDelete(appt.id)} style={{ color:'#303030', fontSize:16, background:'none', border:'none', cursor:'pointer', lineHeight:1 }}
                            onMouseEnter={e=>e.currentTarget.style.color='#d8d8d8'}
                            onMouseLeave={e=>e.currentTarget.style.color='#303030'}>×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
