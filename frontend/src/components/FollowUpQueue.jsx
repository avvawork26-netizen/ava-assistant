import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'   },
  sent:      { label: 'Sent',      color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-surface-700 text-surface-500 border border-surface-600'  },
};

const URGENCY_CONFIG = {
  hot:  { badge: 'badge-hot'  },
  warm: { badge: 'badge-warm' },
  cold: { badge: 'badge-cold' },
};

const TEMPLATE_LABELS = {
  day1: 'Day 1 — Gentle check-in',
  day3: 'Day 3 — Value nudge',
  day7: 'Day 7 — Final re-engagement',
};

const FILTERS = [
  { key: 'pending',   label: 'Pending'   },
  { key: 'sent',      label: 'Sent'      },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all',       label: 'All'       },
];

function formatScheduledDate(dt) {
  const d = new Date(dt);
  const diffMs = d - new Date();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffMs < 0) {
    const over = Math.abs(Math.floor(diffMs / 86400000));
    return { label: over === 0 ? 'Due today' : `${over}d overdue`, overdue: true };
  }
  if (diffDays === 0) return { label: 'Due today', overdue: false };
  if (diffDays === 1) return { label: 'Due tomorrow', overdue: false };
  return { label: `Due in ${diffDays} days`, overdue: false };
}

export default function FollowUpQueue() {
  const [followups, setFollowups]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter]         = useState('pending');

  function fetchFollowUps() {
    setLoading(true);
    const params = filter !== 'all' ? { status: filter } : {};
    api.getFollowUps(params).then(setFollowups).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { fetchFollowUps(); }, [filter]);

  async function handleStatusChange(id, status) {
    try {
      const updated = await api.updateFollowUp(id, { status });
      setFollowups((prev) => prev.map((f) => f.id === id ? { ...f, ...updated } : f));
    } catch (err) { console.error(err); }
  }

  async function handleProcessNow() {
    setProcessing(true);
    try { await api.processFollowUps(); fetchFollowUps(); }
    catch (err) { console.error(err); }
    finally { setProcessing(false); }
  }

  const pendingCount  = followups.filter((f) => f.status === 'pending').length;
  const overdueCount  = followups.filter((f) => f.status === 'pending' && new Date(f.scheduled_date) <= new Date()).length;

  return (
    <div className="p-7 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-100 tracking-tight">Follow-up Queue</h1>
          <p className="text-sm text-surface-500 mt-0.5">Ava auto-schedules Day 1, 3, and 7 follow-ups per lead</p>
        </div>
        <button
          onClick={handleProcessNow}
          disabled={processing}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {processing ? (
            <><div className="w-3.5 h-3.5 border border-surface-400 border-t-surface-900 rounded-full animate-spin" /> Processing...</>
          ) : 'Process Due Now'}
        </button>
      </div>

      {/* Overdue banner */}
      {overdueCount > 0 && (
        <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            {overdueCount} follow-up{overdueCount !== 1 ? 's' : ''} overdue — click Process Due Now to send
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 bg-surface-800 border border-surface-700 rounded p-1 w-fit mb-5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors relative ${
              filter === key ? 'bg-surface-600 text-surface-100' : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            {label}
            {key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-xs leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border border-surface-600 border-t-surface-300 rounded-full animate-spin" />
        </div>
      ) : followups.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-surface-400 font-medium">No follow-ups in this category</p>
          <p className="text-sm text-surface-600 mt-1">New leads get Day 1, 3, and 7 follow-ups automatically</p>
        </div>
      ) : (
        <div className="card divide-y divide-surface-700">
          {followups.map((f) => {
            const urgency  = URGENCY_CONFIG[f.lead_urgency] || URGENCY_CONFIG.cold;
            const status   = STATUS_CONFIG[f.status];
            const dateInfo = formatScheduledDate(f.scheduled_date);
            return (
              <div key={f.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-700/30 transition-colors">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  f.lead_urgency === 'hot' ? 'bg-red-500' : f.lead_urgency === 'warm' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-surface-100 text-sm">{f.lead_name}</p>
                    <span className={urgency.badge}>{f.lead_urgency}</span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {TEMPLATE_LABELS[f.message_template] || f.message_template}
                  </p>
                  {f.lead_phone && <p className="text-xs text-surface-600">{f.lead_phone}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-xs font-semibold ${dateInfo.overdue ? 'text-red-400' : 'text-surface-400'}`}>
                    {dateInfo.label}
                  </p>
                  <p className="text-xs text-surface-600 mt-0.5">
                    {new Date(f.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${status.color}`}>
                    {status.label}
                  </span>
                  {f.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(f.id, 'sent')}
                        className="px-2 py-1 text-xs rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium transition-colors"
                      >
                        Mark Sent
                      </button>
                      <button
                        onClick={() => handleStatusChange(f.id, 'cancelled')}
                        className="px-2 py-1 text-xs rounded bg-surface-700 hover:bg-surface-600 text-surface-400 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
