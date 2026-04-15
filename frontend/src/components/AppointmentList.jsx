import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const TYPE_LABELS = {
  consultation: { label: 'Consultation', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  showing:      { label: 'Showing',      color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  follow_up:    { label: 'Follow-up',    color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
};
const STATUS_COLORS = {
  scheduled:  'bg-emerald-500/10 text-emerald-400',
  completed:  'bg-surface-700 text-surface-500',
  cancelled:  'bg-red-500/10 text-red-400',
};

function formatDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatTime(s) {
  const [h, m] = s.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}
function groupByDate(appts) {
  const g = {};
  appts.forEach((a) => { if (!g[a.date]) g[a.date] = []; g[a.date].push(a); });
  return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
}

const FILTERS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'today',    label: 'Today'    },
  { key: 'all',      label: 'All'      },
];

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('upcoming');
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.getAppointments().then(setAppointments).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(id, status) {
    try {
      const updated = await api.updateAppointment(id, { status });
      setAppointments((prev) => prev.map((a) => a.id === id ? updated : a));
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await api.deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) { console.error(err); }
  }

  const filtered = appointments.filter((a) => {
    if (filter === 'today')    return a.date === todayStr;
    if (filter === 'upcoming') return a.date >= todayStr && a.status === 'scheduled';
    return true;
  });
  const grouped = groupByDate(filtered);

  return (
    <div className="p-7 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-100 tracking-tight">Appointments</h1>
          <p className="text-sm text-surface-500 mt-0.5">Mon–Fri, 9am–5pm EST</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-surface-800 border border-surface-700 rounded p-1 w-fit mb-5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === key ? 'bg-surface-600 text-surface-100' : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border border-surface-600 border-t-surface-300 rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-surface-400 font-medium">No appointments found</p>
          <p className="text-sm text-surface-600 mt-1">Ava books appointments when leads are ready</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, appts]) => {
            const isToday = date === todayStr;
            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className={`text-xs font-semibold uppercase tracking-widest ${isToday ? 'text-accent-400' : 'text-surface-500'}`}>
                    {isToday ? 'Today — ' : ''}{formatDate(date)}
                  </h2>
                  <div className="flex-1 h-px bg-surface-700" />
                  <span className="text-xs text-surface-600">{appts.length} appt{appts.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="card divide-y divide-surface-700">
                  {appts.map((appt) => {
                    const type = TYPE_LABELS[appt.type] || TYPE_LABELS.consultation;
                    return (
                      <div key={appt.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-16 shrink-0 text-right">
                          <p className="font-bold text-surface-100 text-sm leading-tight">{formatTime(appt.time)}</p>
                        </div>
                        <div className="w-px h-8 bg-surface-700 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-surface-100 text-sm">{appt.lead_name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${type.color}`}>{type.label}</span>
                          </div>
                          {appt.lead_phone && <p className="text-xs text-surface-500 mt-0.5">{appt.lead_phone}</p>}
                          {appt.notes      && <p className="text-xs text-surface-600 mt-1 truncate italic">{appt.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={appt.status}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer bg-transparent ${STATUS_COLORS[appt.status]}`}
                          >
                            {['scheduled','completed','cancelled'].map((s) => (
                              <option key={s} value={s} className="bg-surface-800 text-surface-200">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDelete(appt.id)}
                            className="text-surface-600 hover:text-red-400 transition-colors text-lg leading-none px-1"
                          >
                            ×
                          </button>
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
