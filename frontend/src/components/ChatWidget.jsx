import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

function formatTime(dt) {
  return new Date(dt || Date.now()).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function ChatUI({ leadId: initialLeadId, onLeadCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [leadId, setLeadId]     = useState(initialLeadId || null);
  const [lead, setLead]         = useState(null);
  const [phase, setPhase]       = useState(initialLeadId ? 'chatting' : 'intro');
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (initialLeadId) {
      Promise.all([api.getLead(initialLeadId), api.getConversation(initialLeadId)])
        .then(([lead, msgs]) => {
          setLead(lead);
          setMessages(msgs.map((m) => ({ role: m.role, text: m.message, time: m.created_at })));
        }).catch(console.error);
    }
  }, [initialLeadId]);

  async function startChat(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setPhase('chatting');
    setSending(true);
    try {
      const res = await api.chat({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        message: `Hi! My name is ${formData.name.trim()} and I'm interested in Florida real estate.`,
      });
      setLeadId(res.leadId);
      setLead(res.lead);
      if (onLeadCreated) onLeadCreated(res.leadId);
      setMessages([
        { role: 'user',      text: `Hi! My name is ${formData.name.trim()} and I'm interested in Florida real estate.`, time: new Date().toISOString() },
        { role: 'assistant', text: res.response, time: new Date().toISOString() },
      ]);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', text: userMsg, time: new Date().toISOString() }]);
    try {
      const res = await api.chat({ leadId, message: userMsg });
      setLead(res.lead);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.response, time: new Date().toISOString() }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: "I ran into a technical issue. Please try again in a moment.", time: new Date().toISOString() }]);
    } finally { setSending(false); }
  }

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="flex flex-col h-full bg-surface-900">
        <div className="bg-surface-800 border-b border-surface-700 px-6 pt-8 pb-8 text-center">
          <div className="w-12 h-12 rounded bg-accent-500 flex items-center justify-center text-white text-sm font-bold mx-auto mb-4 tracking-tight">
            AVA
          </div>
          <h2 className="text-xl font-semibold text-surface-100 mb-1">Hi, I'm Ava</h2>
          <p className="text-surface-400 text-sm leading-relaxed">
            AI real estate assistant for Ayoub Realty<br />
            Orlando, Clearwater & the Florida Coast
          </p>
        </div>
        <div className="flex-1 px-6 py-6 bg-surface-900">
          <p className="text-surface-300 font-medium mb-4 text-sm">Let's get started</p>
          <form onSubmit={startChat} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1 uppercase tracking-widest">Your name *</label>
              <input
                type="text" required placeholder="Sarah Johnson"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-surface-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1 uppercase tracking-widest">Phone (optional)</label>
              <input
                type="tel" placeholder="(407) 555-0100"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-surface-500"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-surface-100 hover:bg-white text-surface-900 font-semibold rounded text-sm mt-2 transition-colors">
              Start Chat
            </button>
          </form>
          <p className="text-center text-xs text-surface-600 mt-5">Powered by Ayoub Realty · Orlando & Florida Coast</p>
        </div>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="flex flex-col h-full bg-surface-900">
      <div className="bg-surface-800 border-b border-surface-700 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          AVA
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-100 text-sm">Ava</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-surface-500 text-xs">AI Assistant · Ayoub Realty</p>
          </div>
        </div>
        {lead?.escalation_ready === 1 && (
          <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-medium">
            Escalated
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-surface-600 py-8 text-sm">Say hello to get started</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-0.5">A</div>
            )}
            <div className="max-w-[80%]">
              <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}>{msg.text}</div>
              <p className={`text-xs text-surface-600 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>{formatTime(msg.time)}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded bg-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
            <div className="bubble-assistant flex items-center gap-1.5 py-3">
              {[0,150,300].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-surface-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-surface-800 border-t border-surface-700 flex gap-2">
        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 px-3 py-2 bg-surface-700 border border-surface-600 rounded text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-surface-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-surface-100 hover:bg-white disabled:opacity-40 text-surface-900 text-sm font-medium rounded transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function EmbeddedWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-[380px] h-[560px] rounded-xl shadow-2xl overflow-hidden border border-surface-700 flex flex-col">
          <ChatUI />
        </div>
      )}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-12 h-12 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-600 text-surface-200 shadow-xl flex items-center justify-center text-xs font-bold tracking-tight transition-all active:scale-95"
      >
        {open ? '✕' : 'AVA'}
      </button>
    </div>
  );
}

export { ChatUI, EmbeddedWidget };
export default ChatUI;
