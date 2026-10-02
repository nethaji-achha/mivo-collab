'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Send,
  Sparkles,
  Users,
  Video,
  Smile,
  Hash,
  Filter,
  Flame,
  CheckCircle2,
  Tag,
  Paperclip,
} from 'lucide-react';
import { ProductChatMessage, CompanyProduct } from '@mivo/types';
import { api } from '@/lib/api';

interface ProductTeamChatProps {
  product: CompanyProduct;
  currentUser: { id: string; name: string; avatarUrl?: string | null; role?: string };
}

export function ProductTeamChat({ product, currentUser }: ProductTeamChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ProductChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [selectedStageTag, setSelectedStageTag] = useState<string>('All');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages on product switch
  useEffect(() => {
    if (product?.id) {
      loadMessages();
    }
  }, [product?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await api.getProductMessages(product.id);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load product messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const content = inputContent.trim();
    setInputContent('');
    setIsSending(true);

    const activeStage = product.stages.find((s) => s.status === 'in-progress');
    const stageTag = selectedStageTag !== 'All' ? selectedStageTag : activeStage?.name;

    try {
      const res = await api.sendProductMessage(product.id, {
        content,
        teamId: selectedTeamFilter !== 'all' ? selectedTeamFilter : undefined,
        stageTag,
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data!]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleLaunchInstantSync = () => {
    const slug = `${product.id}-sync-${Date.now().toString(36)}`;
    router.push(`/meetings/${slug}`);
  };

  const filteredMessages = messages.filter((m) => {
    const matchesStage = selectedStageTag === 'All' || m.stageTag === selectedStageTag;
    const matchesTeam = selectedTeamFilter === 'all' || !m.teamId || m.teamId === selectedTeamFilter;
    return matchesStage && matchesTeam;
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-dark-card/90 shadow-2xl overflow-hidden flex flex-col h-[640px]">
      {/* Top Feed Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-dark-bg/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-mivo-500/20 text-mivo-400 border border-mivo-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{product.name} Conversation Feed</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Squad Live
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time squad communication, PR reviews, blockers, and stage milestone notifications.
            </p>
          </div>
        </div>

        {/* Quick Launch & Filters */}
        <div className="flex items-center gap-2">
          {/* Squad Filter Dropdown */}
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="rounded-xl bg-dark-card border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-mivo-500"
          >
            <option value="all">All Squads ({product.teams?.length || 1})</option>
            {product.teams?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleLaunchInstantSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 hover:from-mivo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-mivo-600/20 transition-all shrink-0"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Launch Sync</span>
          </button>
        </div>
      </div>

      {/* Stage Tag Filter Strip */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-dark-bg/40 border-b border-white/5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Topic Stage:
        </span>
        {['All', ...product.stages.map((s) => s.name)].map((tagName) => (
          <button
            key={tagName}
            onClick={() => setSelectedStageTag(tagName)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
              selectedStageTag === tagName
                ? 'bg-mivo-500/25 text-mivo-300 border border-mivo-500/40'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {tagName}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {filteredMessages.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-semibold">No messages in this filter yet.</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Start a conversation with your product squad about sprints, PRDs, or architecture decisions.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;

            if (msg.isSystemAnnouncement) {
              return (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-mivo-950/60 to-dark-card border border-mivo-500/30 text-xs text-slate-200 flex items-start gap-3 shadow-md"
                >
                  <div className="p-1.5 rounded-lg bg-mivo-500/20 text-mivo-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                      <span>{msg.senderName}</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="leading-relaxed font-medium">{msg.content}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-xl bg-mivo-600/30 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden">
                  {msg.senderAvatar ? (
                    <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                  ) : (
                    msg.senderName.charAt(0)
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-xl space-y-1 ${
                    isMe ? 'items-end text-right' : 'items-start text-left'
                  }`}
                >
                  <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                    <span className="font-bold text-slate-200">{msg.senderName}</span>
                    {msg.senderRole && (
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-white/5">
                        {msg.senderRole}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-r from-mivo-600 to-cyan-600 text-white shadow-lg shadow-mivo-600/15'
                        : 'bg-dark-bg/80 border border-white/10 text-slate-200 shadow'
                    }`}
                  >
                    {msg.stageTag && (
                      <div className="mb-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/30 text-cyan-200 uppercase font-mono">
                          [{msg.stageTag}]
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Emoji Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className={`flex items-center gap-1.5 pt-0.5 ${isMe ? 'justify-end' : ''}`}>
                      {Object.entries(msg.reactions).map(([emoji, users]) => (
                        <span
                          key={emoji}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1 shadow-sm"
                          title={users.join(', ')}
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] font-bold text-slate-400">{users.length}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 border-t border-white/10 bg-dark-bg/90 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder={`Message ${product.name} squad (tag: ${
            selectedStageTag !== 'All' ? selectedStageTag : 'current stage'
          })...`}
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          className="flex-1 bg-dark-card border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
        />

        <button
          type="submit"
          disabled={!inputContent.trim() || isSending}
          className="p-2.5 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 hover:opacity-95 text-white disabled:opacity-40 shadow-lg shadow-mivo-600/20 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
