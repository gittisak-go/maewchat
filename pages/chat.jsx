import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabaseClient';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [otherUserId, setOtherUserId] = useState('');

  useEffect(() => {
    // get current user
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUser(user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    // load conversations where user is a participant
    async function loadConversations() {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) console.error('Load conv error', error);
      else setConversations(data || []);
    }
    loadConversations();

    // subscribe to conversations changes (simplified)
    const convSub = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        // refetch when conversations change
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(convSub);
    };
  }, [user]);

  async function signIn() {
    if (!email) return alert('Enter email');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Check your email for the magic link');
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function createConversation() {
    if (!otherUserId) return alert('Enter other user id');
    const payload = {
      user1_id: user.id,
      user2_id: otherUserId,
    };
    const { data, error } = await supabase.from('conversations').insert(payload).select().single();
    if (error) return alert(error.message);
    setConversations((c) => [data, ...c]);
    setOtherUserId('');
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>maewchat — Example Chat</h1>
      {!user ? (
        <div style={{ maxWidth: 420 }}>
          <p>Sign in with email (magic link):</p>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button onClick={signIn}>Send magic link</button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Signed in:</strong> {user.email} ({user.id})
            </div>
            <div>
              <button onClick={signOut}>Sign out</button>
            </div>
          </div>

          <hr />

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ width: 300 }}>
              <h3>Conversations</h3>
              <div>
                <input
                  placeholder="Other user id"
                  value={otherUserId}
                  onChange={(e) => setOtherUserId(e.target.value)}
                />
                <button onClick={createConversation}>Create</button>
              </div>
              <ul>
                {conversations.map((c) => (
                  <li key={c.id} style={{ margin: '8px 0' }}>
                    <button
                      onClick={() => setSelectedConv(c)}
                      style={{ background: selectedConv?.id === c.id ? '#eef' : 'transparent' }}
                    >
                      Conversation: {c.id}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ flex: 1 }}>
              {selectedConv ? (
                <ChatWindow conversation={selectedConv} user={user} />
              ) : (
                <div>Select a conversation to start chatting</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}