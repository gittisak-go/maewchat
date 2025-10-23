import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../src/lib/supabaseClient';

export default function ChatWindow({ conversation, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    let mounted = true;
    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      if (error) console.error('load messages', error);
      else if (mounted) setMessages(data || []);
    }
    loadMessages();

    const channel = supabase
      .channel(`messages:conversation_id=eq.${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, (payload) => {
        setMessages((m) => [...m, payload.new]);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim()) return;
    const payload = {
      conversation_id: conversation.id,
      content: text,
    };
    const { data, error } = await supabase.from('messages').insert(payload).select().single();
    if (error) return alert(error.message);
    setText('');
    // Optimistic UI: message will come via realtime subscription
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 8 }}>
        <strong>Conversation:</strong> {conversation.id}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 4px' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ margin: '6px 0', textAlign: m.sender_id === user.id ? 'right' : 'left' }}>
            <div style={{ display: 'inline-block', background: m.sender_id === user.id ? '#dcf8c6' : '#f1f0f0', padding: 8, borderRadius: 6 }}>
              <div style={{ fontSize: 14 }}>{m.content}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{new Date(m.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1 }} placeholder="Type a message" />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}