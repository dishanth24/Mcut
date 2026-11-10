import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MemberAvatar from '@/components/common/MemberAvatar';
import { displayName } from '@/lib/profile';
import { relativeTime } from '@/lib/trips';

export default function ChatTab({ trip, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    base44.entities.ChatMessage.filter({ trip_id: trip.id }, { sort: '-created_date', limit: 100 })
      .then((page) => {
        if (!cancelled) setMessages((page.items || []).slice().reverse());
      })
      .catch(() => {});

    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== 'create' || event.data?.trip_id !== trip.id) return;
      setMessages((prev) => (prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]));
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [trip.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    try {
      const created = await base44.entities.ChatMessage.create({
        trip_id: trip.id,
        user_id: user.id,
        user_name: displayName(user),
        text: body,
        members: trip.members || [],
      });
      setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card-surface flex h-[65vh] min-h-96 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet — say hello to your travel mates.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.user_id === user.id;
            return (
              <div key={message.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                <MemberAvatar name={message.user_name} size="sm" />
                <div className={`max-w-[75%] ${mine ? 'text-right' : ''}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm ${
                      mine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {message.text}
                  </div>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    {mine ? 'You' : message.user_name} · {relativeTime(message.created_date)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the trip"
          aria-label="Message"
        />
        <Button type="submit" size="icon" disabled={!text.trim() || sending} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}