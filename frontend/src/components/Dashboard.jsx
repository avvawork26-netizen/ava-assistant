import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const URGENCY_CONFIG = {
  hot:  { label: 'Hot',  dot: 'bg-red-500',   badge: 'badge-hot'  },
  warm: { label: 'Warm', dot: 'bg-amber-400',  badge: 'badge-warm' },
  cold: { label: 'Cold', dot: 'bg-blue-400',   badge: 'badge-cold' },
};

const INTENT_LABELS = {
  buy: 'Buyer', sell: 'Seller', rent: 'Renter', invest: 'Investor', unknown: 'Unknown',
};

function UrgencyBadge({ urgency }) {
  const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.cold;
  return <span className={cfg.badge}>{cfg.label}</span>;
}

function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`card p-5 ${accent ? 'border-accent-500/30' : ''}`}>
      <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${accent ? 'text-accent-400' : 'text-surface-100'}`}>{value}</p>
      {sub && <p className="text-xs text-surface-600 mt-1">{sub}</p>}
    </div>
  );
}

function EscalationCard({ lead, onViewConvo }) {
  return (
    <div className="card border border-red-500/30 bg-red-500/5 p-5 escalation-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-red-400">
              Escalation Ready
            </span>
          </div>
          <h3 className="font-semibold text-surface-100 text-base">{lead.name}</h3>
          <p className="text-xs text-surface-500 mt-0.5">
            {lead.phone || lead.email || 'No contact on file'}
          </p>
        </div>
        <button
          onClick={() => onViewConvo(lead.id)}
          className="btn-primary text-xs py-1.5 shrink-0"
        >
          View Conversation
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {[
          ['Intent',   INTENT_LABELS[lead.intent] || lead.intent],
          ['Budget',   lead.budget   || '—'],
          ['Timeline', lead.timeline || '—'],
          ['Area',     lead.area     || '—'],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface-700 rounded px-3 py-2">
            <p className="text-xs text-surface-500 font-medium">{k}</p>
            <p className="text-sm text-surface-200 font-semibold mt-0.5">{v}</p>
          </div>
        ))}
      </div>
      {lead.notes && (
        <div className="mt-3 bg-surface-700 rounded px-3 py-2 text-xs text-surface-400 leading-relaxed border-l-2 border-accent-500">
          {lead.notes}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ onSelectLead }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getLeads(),
      api.getAppointments({ status: 'scheduled' }),
      api.getFollowUps({ status: 'pending' }),
    ])
      .then(([l, a, f]) => { setLeads(l); setAppointments(a); setFollowups(f); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hotLeads      = leads.filter((l) => l.urgency === 'hot');
  const escalatedLeads = leads.filter((l) => l.escalation_ready);
  const todayStr      = new Date().toISOString().split('T')[0];
  const todayAppts    = appointments.filter((a) => a.date === todayStr);
  const dueFollowups  = followups.filter((f) => new Date(f.scheduled_date) <= new Date());

  function handleViewConvo(leadId) {
    onSelectLead(leadId);
    navigate('/conversations');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-5 h-5 border border-surface-500 border-t-surface-200 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-surface-500 text-xs tracking-wide">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-100 tracking-tight">
            Good morning, Ayoub
          </h1>
          <p className="text-surface-500 text-xs mt-1 tracking-wide">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}Orlando, FL
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 border border-surface-700 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-surface-400 tracking-wide">Ava online</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Leads"          value={leads.length}        sub="All time"     />
        <StatCard label="Hot Leads"             value={hotLeads.length}     sub="Need attention" accent />
        <StatCard label="Today's Appointments"  value={todayAppts.length}   sub="Scheduled"    />
        <StatCard label="Follow-ups Due"        value={dueFollowups.length} sub="Pending send"  />
      </div>

      {/* Escalation Queue */}
      {escalatedLeads.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Escalation Queue</h2>
            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
              {escalatedLeads.length}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {escalatedLeads.map((lead) => (
              <EscalationCard key={lead.id} lead={lead} onViewConvo={handleViewConvo} />
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Leads */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Recent Leads</h2>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs text-accent-400 hover:text-accent-300 font-medium transition-colors"
            >
              View all
            </button>
          </div>
          <div className="card divide-y divide-surface-700">
            {leads.slice(0, 5).map((lead) => (
              <div
                key={lead.id}
                onClick={() => handleViewConvo(lead.id)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-700/50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded bg-surface-700 border border-surface-600 flex items-center justify-center text-surface-300 font-semibold text-xs shrink-0">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-200 text-sm truncate">{lead.name}</p>
                  <p className="text-xs text-surface-500 truncate">{lead.area || lead.intent || 'New lead'}</p>
                </div>
                <UrgencyBadge urgency={lead.urgency} />
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-center text-surface-600 py-8 text-xs tracking-wide">No leads yet</p>
            )}
          </div>
        </section>

        {/* Today's Appointments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Today's Appointments</h2>
            <button
              onClick={() => navigate('/appointments')}
              className="text-xs text-accent-400 hover:text-accent-300 font-medium transition-colors"
            >
              View all
            </button>
          </div>
          <div className="card divide-y divide-surface-700">
            {todayAppts.length === 0 && (
              <p className="text-center text-surface-600 py-8 text-xs tracking-wide">No appointments today</p>
            )}
            {todayAppts.map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 text-center shrink-0">
                  <p className="text-sm font-bold text-surface-200 leading-none">
                    {appt.time.replace(':00', '')}
                  </p>
                  <p className="text-xs text-surface-600">
                    {parseInt(appt.time) < 12 ? 'AM' : 'PM'}
                  </p>
                </div>
                <div className="w-px h-7 bg-surface-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-200 text-sm truncate">{appt.lead_name}</p>
                  <p className="text-xs text-surface-500 capitalize">{appt.type.replace('_', ' ')}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Follow-ups Due */}
      {dueFollowups.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Follow-ups Due</h2>
            <button
              onClick={() => navigate('/followups')}
              className="text-xs text-accent-400 hover:text-accent-300 font-medium transition-colors"
            >
              Manage
            </button>
          </div>
          <div className="card divide-y divide-surface-700">
            {dueFollowups.slice(0, 3).map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  f.lead_urgency === 'hot'  ? 'bg-red-500' :
                  f.lead_urgency === 'warm' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-200 text-sm">{f.lead_name}</p>
                  <p className="text-xs text-surface-500">
                    Due {new Date(f.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}{f.message_template} follow-up
                  </p>
                </div>
                <button
                  onClick={() => navigate('/followups')}
                  className="text-xs text-accent-400 hover:text-accent-300 font-medium transition-colors"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
