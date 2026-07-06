import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import clubConfig from '@/config/club.config';
import ReactMarkdown from 'react-markdown';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';

const t = clubConfig.theme;

export default function MembershipAssistant() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'membership_assistant',
        metadata: { name: 'Membership Chat' }
      });
      setConversation(conv);
      setMessages(conv.messages || []);

      const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages([...data.messages]);
      });

      // Send a greeting
      await base44.agents.addMessage(conv, {
        role: 'user',
        content: "Hi, I'd like to know about my membership."
      });

      return () => unsub();
    } catch (err) {
      console.error(err);
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !conversation) return;
    const text = input.trim();
    setInput('');
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const visibleMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');

  return (
    <div className="flex flex-col h-screen" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 pt-safe" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <Link to="/">
          <button className="p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${t.gold}22`, border: `1px solid ${t.gold}33` }}>
          <Bot className="w-6 h-6" style={{ color: t.gold }} />
        </div>
        <div>
          <Eyebrow color={t.gold}>AI Assistant</Eyebrow>
          <p className="text-white font-bold text-sm" style={{ fontFamily: t.fontBody }}>Membership Assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {initializing && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: t.gold }} />
          </div>
        )}

        {visibleMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ background: `${t.gold}1a`, border: `1px solid ${t.gold}33` }}>
                <Bot className="w-4 h-4" style={{ color: t.gold }} />
              </div>
            )}
            <div
              className="max-w-[80%] rounded-2xl px-4 py-3"
              style={msg.role === 'user'
                ? { background: t.gold, color: t.bg0 }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.9)' }
              }
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  components={{
                    a: ({ children, href }) => (
                      <a href={href} className="underline" style={{ color: t.gold }}>{children}</a>
                    )
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p className="text-sm" style={{ fontFamily: t.fontBody }}>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${t.gold}1a`, border: `1px solid ${t.gold}33` }}>
              <Bot className="w-4 h-4" style={{ color: t.gold }} />
            </div>
            <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: t.gold }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 pb-safe" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your membership..."
            className="flex-1"
            disabled={loading || initializing}
            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
          />
          <GoldButton
            onClick={sendMessage}
            disabled={loading || initializing || !input.trim()}
            style={{ padding: '8px 16px' }}
          >
            <Send className="w-4 h-4" />
          </GoldButton>
        </div>
      </div>
    </div>
  );
}