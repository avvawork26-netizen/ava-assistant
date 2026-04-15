import React from 'react';
import ChatWidget from './ChatWidget';

export default function ChatPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'#080808' }}>
      <div className="w-full max-w-md overflow-hidden flex flex-col"
        style={{ height:700, border:'1px solid #1e1e1e', boxShadow:'0 40px 80px rgba(0,0,0,0.8)' }}>
        <ChatWidget />
      </div>
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p style={{ fontSize:10, color:'#303030', letterSpacing:'0.08em' }}>
          Powered by <span style={{ color:'#4A9EFF' }}>Ava AI</span> · Ayoub Realty · Orlando &amp; Florida Coast
        </p>
      </div>
    </div>
  );
}
