import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const URGENCY_CONFIG = {
  hot:  { label: 'Hot',  badge: 'badge-hot'  },
  warm: { label: 'Warm', badge: 'badge-warm' },
  cold: { label: 'Cold', badge: 'badge-cold' },
};

const INTENT_MAP = {
  buy:     { label: 'Buyer',    cls: 'badge-buy'     },
  sell:    { label: 'Seller',   cls: 'badge-sell'    },
  rent:    { label: 'Renter',   cls: 'badge-rent'    },
  invest:  { label: 'Investor', cls: 'badge-invest'  },
  unknown: { label: '—',        cls: 'badge-unknown' },
};

const STATUS_COLORS = {
  new:       'bg-surface-700 text-surface-300',
  active:    'bg-blue-500/10 text-blue-400',
  escalated: 'bg-red-500/10 text-red-400',
  closed:    'bg-surface-800 text-surface-500',
};

const FILTERS = [
  { key: 'all',       label: 'All'       },
  { key: 'hot',       label: 'Hot'       },
  { key: 'warm',      label: 'Warm'      },
  { key: 'cold',      label: 'Cold'      },
  { key: 'escalated', label: 'Escalated' },
];

export default function LeadList({ selectedLeadId, onSelectLead }) {
  const navigate = useNavigate();
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter === 'escalated') params.escalation_ready = 'true';
    else if (filter !== 'all') params.urgency = filter;
    api.getLeads(params).then(setLeads).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = leads.filter((l) =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').includes(search) ||
    (l.area || '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleStatusChange(lead, status) {
    try {
      const updated = await api.updateLead(lead.id, { status });
      setLeads((prev) => prev.map((l) => l.id === lead.id ? updated : l));
    } catch (err) { console.error(err); }
  }

  function handleViewConvo(leadId) { onSelectLead(leadId); navigate('/conversations'); }

  return (
    <div className="p-7 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-100 tracking-tight">Leads</h1>
          <p className="text-sm text-surface-500 mt-0.5">{leads.length} total</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1 bg-surface-800 border border-surface-700 rounded p-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-surface-600 text-surface-100'
                  : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name, email, area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-surface-800 border border-surface-700 rounded text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-surface-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border border-surface-600 border-t-surface-300 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-surface-600">
              <p className="font-medium text-surface-400">No leads found</p>
              <p className="text-sm mt-1">Try adjusting the filters or search</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-surface-700">
                <tr>
                  {['Lead', 'Intent', 'Budget', 'Area', 'Timeline', 'Urgency', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {filtered.map((lead) => {
                  const urgency = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.cold;
                  const intent  = INTENT_MAP[lead.intent] || INTENT_MAP.unknown;
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-surface-700/40 transition-colors ${lead.id === selectedLeadId ? 'bg-surface-700/60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {lead.escalation_ready === 1 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-surface-100">{lead.name}</p>
                            <p className="text-xs text-surface-500 mt-0.5">{lead.phone || lead.email || 'No contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={intent.cls}>{intent.label}</span></td>
                      <td className="px-4 py-3 text-surface-400">{lead.budget || '—'}</td>
                      <td className="px-4 py-3 text-surface-400 max-w-[140px] truncate">{lead.area || '—'}</td>
                      <td className="px-4 py-3 text-surface-400">{lead.timeline || '—'}</td>
                      <td className="px-4 py-3"><span className={urgency.badge}>{urgency.label}</span></td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer bg-transparent ${STATUS_COLORS[lead.status] || STATUS_COLORS.active}`}
                        >
                          {['new', 'active', 'escalated', 'closed'].map((s) => (
                            <option key={s} value={s} className="bg-surface-800 text-surface-200">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewConvo(lead.id)}
                          className="px-2.5 py-1 text-xs rounded bg-surface-700 hover:bg-surface-600 text-surface-200 font-medium transition-colors"
                        >
                          View Chat
                        </button>
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
