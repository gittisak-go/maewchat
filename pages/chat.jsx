import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabaseClient';
import ChatWindow from '../components/ChatWindow';
import ProfileEditor from '../components/ProfileEditor';

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => { if (mounted) setUser(data.user ?? null); });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => { mounted = false; listener?.subscription?.unsubscribe?.(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    async function loadConvs() {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (!error && mounted) setConversations(data || []);
    }
    loadConvs();

    const sub = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadConvs())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(sub); };
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6">
        <aside className="col-span-1 bg-[#0f1724] rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden">
              <img src={user?.user_metadata?.avatar_url || '/images/default-avatar.png'} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold">{user?.user_metadata?.username || user?.email || 'Guest'}</div>
              <a href={`/profile/${user?.id}`} className="text-xs text-blue-400 hover:underline">View profile</a>
            </div>
          </div>

          <ProfileEditor compact />

          <div className="mt-4">
            <h4 className="text-xs text-gray-400 mb-2">Conversations</h4>
            <div className="space-y-2">
              {conversations.map(c => (
                <button key={c.id} onClick={() => setSelectedConv(c)} className={`w-full text-left p-3 rounded ${selectedConv?.id === c.id ? 'bg-[#06202a]' : 'hover:bg-gray-800'}`}> 
                  <div className="text-xs text-gray-500">ID</div>
                  <div className="font-mono text-sm truncate">{c.id}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="col-span-3">
          <div className="bg-[#071122] rounded-lg shadow p-2 h-[80vh] flex flex-col">
            {!selectedConv ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation to start chatting</div>
            ) : (
              <ChatWindow conversation={selectedConv} user={user} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
