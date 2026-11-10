import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MemberAvatar from '@/components/common/MemberAvatar';
import { displayName } from '@/lib/profile';
import { motion, useReducedMotion } from 'framer-motion';

function formatMessageTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDayDivider(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ChatTab({ trip, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    base44.entities.ChatMessage.filter({ trip_id: trip.id }, { sort: '-created_date', limit: 120 })
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
    bottomRef.current?.scrollIntoView({ behavior: shouldReduce ? 'auto' : 'smooth', block: 'nearest' });
  }, [messages.length, shouldReduce]);

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

  // Group messages with day dividers
  const groupedWithDividers = useMemo(() => {
    const list = [];
    let lastDay = '';
    messages.forEach((msg) => {
      const day = formatDayDivider(msg.created_date);
      if (day && day !== lastDay) {
        list.push({ isDivider: true, dateText: day, id: `divider-${msg.id || day}` });
        lastDay = day;
      }
      list.push(msg);
    });
    return list;
  }, [messages]);

  return (
    <div className="card-surface flex h-[68vh] min-h-[460px] flex-col overflow-hidden border-border/80 shadow-md">
      {/* ── Messages stream ── */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D98264]/10 text-[#D98264] mb-3">
              <MessageSquare className="h-6 w-6" />
            </span>
            <p className="font-heading text-lg">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Say hello to the crew, discuss split arrangements, or plan where to eat tonight.
            </p>
          </div>
        ) : (
          groupedWithDividers.map((item) => {
            if (item.isDivider) {
              return (
                <div key={item.id} className="flex items-center justify-center my-3">
                  <span className="rounded-full border border-border/70 bg-secondary/80 px-3 py-0.5 text-[0.65rem] font-semibold text-muted-foreground shadow-2xs">
                    {item.dateText}
                  </span>
                </div>
              );
            }

            const mine = item.user_id === user.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-end gap-2.5 ${mine ? 'justify-end' : 'justify-start'}`}
              >
                {!mine && <MemberAvatar name={item.user_name} size="sm" />}

                <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${mine ? 'items-end' : 'items-start'}`}>
                  {!mine && (
                    <span className="text-[0.68rem] font-medium text-muted-foreground px-1 mb-1">
                      {item.user_name.split(' ')[0]}
                    </span>
                  )}

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
                      mine
                        ? 'bg-gradient-to-r from-[#D98264] to-[#C97254] text-white rounded-br-xs'
                        : 'bg-card border border-border/80 text-foreground rounded-bl-xs'
                    }`}
                  >
                    {item.text}
                  </div>

                  <span className="mt-1 px-1 text-[0.62rem] text-muted-foreground">
                    {formatMessageTime(item.created_date)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Sticky Chat Input ── */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-border/70 bg-card/70 p-3 sm:p-4 backdrop-blur-sm">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message your travel mates…"
          className="h-11 rounded-2xl border-border/80 bg-background/90 text-sm focus-visible:ring-[#D98264]"
          aria-label="Message"
          disabled={sending}
        />
        <motion.div whileHover={shouldReduce ? {} : { scale: 1.05 }} whileTap={shouldReduce ? {} : { scale: 0.92 }}>
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || sending}
            className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#D98264] to-[#C97254] text-white border-0 shadow-md shadow-[#D98264]/20 hover:opacity-95"
            aria-label="Send message"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
