import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

function formatTime(dt) {
  return new Date(dt||Date.now()).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
}

function ChatUI({ leadId: initialLeadId, onLeadCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [leadId, setLeadId] = useState(initialLeadId||null);
  const [lead, setLead] = useState(null);
  const [phase, setPhase] = useState(initialLeadId?'chatting':'intro');
  const [formData, setFormData] = useState({name:'',phone:''});
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  useEffect(()=>{
    if(initialLeadId){
      Promise.all([api.getLead(initialLeadId),api.getConversation(initialLeadId)])
        .then(([l,msgs])=>{ setLead(l); setMessages(msgs.map(m=>({role:m.role,text:m.message,time:m.created_at}))); })
        .catch(console.error);
    }
  },[initialLeadId]);

  async function startChat(e) {
    e.preventDefault();
    if(!formData.name.trim()) return;
    setPhase('chatting'); setSending(true);
    try {
      const res = await api.chat({ name:formData.name.trim(), phone:formData.phone.trim()||undefined,
        message:`Hi! My name is ${formData.name.trim()} and I'm interested in Florida real estate.` });
      setLeadId(res.leadId); setLead(res.lead);
      if(onLeadCreated) onLeadCreated(res.leadId);
      setMessages([
        {role:'user',text:`Hi! My name is ${formData.name.trim()} and I'm interested in Florida real estate.`,time:new Date().toISOString()},
        {role:'assistant',text:res.response,time:new Date().toISOString()},
      ]);
    } catch(err){ console.error(err); } finally{ setSending(false); }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if(!input.trim()||sending) return;
    const msg=input.trim(); setInput(''); setSending(true);
    setMessages(p=>[...p,{role:'user',text:msg,time:new Date().toISOString()}]);
    try {
      const res=await api.chat({leadId,message:msg});
      setLead(res.lead);
      setMessages(p=>[...p,{role:'assistant',text:res.response,time:new Date().toISOString()}]);
    } catch(err){
      setMessages(p=>[...p,{role:'assistant',text:"I ran into a technical issue. Please try again in a moment!",time:new Date().toISOString()}]);
    } finally{ setSending(false); }
  }

  if(phase==='intro') return (
    <div className="flex flex-col h-full" style={{ background:'#080808' }}>
      <div className="px-6 pt-8 pb-8 text-center" style={{ background:'#0d0d0d', borderBottom:'1px solid #1e1e1e' }}>
        <div style={{ fontSize:22, fontWeight:300, letterSpacing:'0.3em', color:'#ffffff', textTransform:'uppercase', marginBottom:6 }}>Ava</div>
        <p style={{ fontSize:11, color:'#404040', letterSpacing:'0.08em' }}>AI Real Estate Guide · Orlando, Clearwater &amp; Florida Coast</p>
      </div>
      <div className="flex-1 px-6 py-6" style={{ background:'#080808' }}>
        <p style={{ fontSize:9, fontWeight:500, letterSpacing:'0.12em', color:'#404040', textTransform:'uppercase', textAlign:'center', marginBottom:16 }}>Get started</p>
        <form onSubmit={startChat} className="space-y-3">
          <div>
            <label style={{ fontSize:9, fontWeight:500, letterSpacing:'0.1em', color:'#404040', textTransform:'uppercase', display:'block', marginBottom:5 }}>Your name *</label>
            <input type="text" required placeholder="e.g. Sarah Johnson" value={formData.name}
              onChange={e=>setFormData(p=>({...p,name:e.target.value}))} className="input" />
          </div>
          <div>
            <label style={{ fontSize:9, fontWeight:500, letterSpacing:'0.1em', color:'#404040', textTransform:'uppercase', display:'block', marginBottom:5 }}>Phone number (optional)</label>
            <input type="tel" placeholder="e.g. (407) 555-0100" value={formData.phone}
              onChange={e=>setFormData(p=>({...p,phone:e.target.value}))} className="input" />
          </div>
          <button type="submit" className="btn-primary w-full py-3 mt-2">Start Chat</button>
        </form>
        <p style={{ textAlign:'center', fontSize:10, color:'#303030', marginTop:16 }}>Powered by Ayoub Realty · Orlando &amp; Florida Coast</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background:'#080808' }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ background:'#0d0d0d', borderBottom:'1px solid #1e1e1e' }}>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize:14, fontWeight:300, letterSpacing:'0.2em', color:'#ffffff', textTransform:'uppercase' }}>Ava</p>
          <div className="flex items-center gap-1.5" style={{ marginTop:2 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#4A9EFF', flexShrink:0 }} />
            <p style={{ fontSize:10, color:'#4A9EFF' }}>Online · Ayoub Realty</p>
          </div>
        </div>
        {lead?.escalation_ready===1 && (
          <span style={{ fontSize:9, padding:'2px 8px', letterSpacing:'0.08em', textTransform:'uppercase', background:'#0c1d33', color:'#4A9EFF', border:'1px solid #172d4d' }}>Escalated</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background:'#080808' }}>
        {messages.length===0 && <p className="text-center py-8" style={{ fontSize:11, color:'#404040' }}>Say hello to get started.</p>}
        {messages.map((msg,i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role==='user'?'justify-end':'justify-start'}`}>
            {msg.role==='assistant' && (
              <div className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mb-0.5"
                style={{ background:'#0c1d33', color:'#4A9EFF' }}>A</div>
            )}
            <div className="max-w-[80%]">
              <div className={msg.role==='user'?'bubble-user':'bubble-assistant'}>{msg.text}</div>
              <p className={`mt-1 ${msg.role==='user'?'text-right':''}`} style={{ fontSize:10, color:'#404040' }}>{formatTime(msg.time)}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background:'#0c1d33', color:'#4A9EFF' }}>A</div>
            <div className="bubble-assistant flex items-center gap-1.5 py-3">
              {[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background:'#303030', animationDelay:`${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 flex gap-2" style={{ background:'#0d0d0d', borderTop:'1px solid #1e1e1e' }}>
        <input type="text" value={input} onChange={e=>setInput(e.target.value)}
          placeholder="Type a message..." disabled={sending} className="input flex-1"
          style={{ opacity:sending?0.6:1 }} />
        <button type="submit" disabled={sending||!input.trim()} className="btn-primary px-4 py-2"
          style={{ opacity: sending||!input.trim()?0.4:1 }}>Send</button>
      </form>
    </div>
  );
}

function EmbeddedWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-[380px] h-[560px] overflow-hidden flex flex-col"
          style={{ border:'1px solid #1e1e1e', boxShadow:'0 25px 50px rgba(0,0,0,0.9)' }}>
          <ChatUI />
        </div>
      )}
      <button onClick={()=>setOpen(p=>!p)} title="Chat with Ava"
        style={{
          width:52, height:52, background:'#0d0d0d', border:'1px solid #4A9EFF',
          color:'#4A9EFF', fontSize:11, fontWeight:500, letterSpacing:'0.1em',
          textTransform:'uppercase', cursor:'pointer', boxShadow:'0 0 20px rgba(74,158,255,0.15)',
        }}>
        {open ? '✕' : 'AVA'}
      </button>
    </div>
  );
}

export { ChatUI, EmbeddedWidget };
export default ChatUI;
