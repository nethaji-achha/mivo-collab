'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Smile, Shield, Users, Lock, Globe, MessageSquare } from 'lucide-react';
import { ChatMessage, PeerMediaState } from '@mivo/types';
import { format } from 'date-fns';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  participants: PeerMediaState[];
  currentUserId?: string;
  onSendMessage: (content: string, recipientId?: string) => void;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  participants,
  currentUserId,
  onSendMessage,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<'everyone' | 'host' | string>('everyone');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(
      inputText.trim(),
      selectedRecipient === 'everyone' ? undefined : selectedRecipient
    );
    setInputText('');
  };

  const quickEmojis = ['👋', '👍', '❤️', '👏', '🔥', '💡'];

  // Identify host participant (if any)
  const hostParticipant = participants.find((p) => p.role === 'host');
  const isMeHost = participants.find((p) => p.peerId === currentUserId)?.role === 'host';

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-white/10 bg-dark-bg/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-200">
      {/* 1. Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-mivo-500/10 border border-mivo-500/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-mivo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">In-Meeting Chat</h3>
            <p className="text-[11px] text-slate-400">Real-time room communication</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Recipient Selector: Everyone, Host, or Other Persons */}
      <div className="border-b border-white/10 bg-dark-surface/60 p-3 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span>Send Message To:</span>
          {selectedRecipient === 'host' ? (
            <span className="text-amber-400 flex items-center space-x-1 font-bold">
              <Shield className="h-3 w-3" />
              <span>Private to Host</span>
            </span>
          ) : selectedRecipient === 'everyone' ? (
            <span className="text-cyan-400 flex items-center space-x-1 font-bold">
              <Globe className="h-3 w-3" />
              <span>Public (Everyone)</span>
            </span>
          ) : (
            <span className="text-purple-400 flex items-center space-x-1 font-bold">
              <Users className="h-3 w-3" />
              <span>Private Direct</span>
            </span>
          )}
        </div>

        {/* 3-Option Segmented Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-dark-card border border-white/10 text-[11px]">
          <button
            type="button"
            onClick={() => setSelectedRecipient('everyone')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg font-semibold transition-all ${
              selectedRecipient === 'everyone'
                ? 'bg-gradient-to-r from-mivo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="h-3 w-3" />
            <span>Everyone</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRecipient('host')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg font-semibold transition-all ${
              selectedRecipient === 'host'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="h-3 w-3" />
            <span>Host</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const other = participants.find((p) => p.peerId !== currentUserId && p.role !== 'host');
              setSelectedRecipient(other ? other.peerId : 'host');
            }}
            className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg font-semibold transition-all ${
              selectedRecipient !== 'everyone' && selectedRecipient !== 'host'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="h-3 w-3" />
            <span>Person</span>
          </button>
        </div>

        {/* Detailed Dropdown Selector */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-[11px] text-slate-400">Target:</span>
          <select
            value={selectedRecipient}
            onChange={(e) => setSelectedRecipient(e.target.value)}
            className="rounded-lg bg-dark-bg border border-white/10 px-2.5 py-1 text-xs text-white focus:border-mivo-500 focus:outline-none"
          >
            <option value="everyone">🌐 Everyone in Call</option>
            <option value="host">🛡️ Meeting Host {hostParticipant ? `(${hostParticipant.displayName})` : ''}</option>
            {participants
              .filter((p) => p.peerId !== currentUserId && p.role !== 'host')
              .map((p) => (
                <option key={p.peerId} value={p.peerId}>
                  👤 {p.displayName} (Private Direct)
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* 3. Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 p-6">
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-300">No messages in call yet.</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Send a message to <strong>Everyone</strong> or privately to the <strong>Host</strong>.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isToHost = msg.recipientId === 'host' || msg.recipientName === 'Host';
            const isPrivate = msg.isPrivate || Boolean(msg.recipientId && msg.recipientId !== 'everyone');

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="text-[11px] font-semibold text-slate-300">
                    {isMe ? 'You' : msg.senderName}
                  </span>

                  {/* Badges for Host / Private routing */}
                  {isToHost ? (
                    <span className="rounded bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 flex items-center space-x-1">
                      <Shield className="h-2.5 w-2.5" />
                      <span>Host Private</span>
                    </span>
                  ) : isPrivate ? (
                    <span className="rounded bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.2 text-[9px] font-bold text-rose-300 flex items-center space-x-1">
                      <Lock className="h-2.5 w-2.5" />
                      <span>Private</span>
                    </span>
                  ) : (
                    <span className="rounded bg-white/5 px-1 text-[9px] font-medium text-slate-400">
                      Everyone
                    </span>
                  )}

                  <span className="text-[10px] text-slate-500">
                    {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}
                  </span>
                </div>

                <div
                  className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed max-w-[88%] ${
                    isMe
                      ? isToHost
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-tr-sm shadow-md'
                        : 'bg-gradient-to-r from-mivo-600 to-cyan-600 text-white rounded-tr-sm shadow-md'
                      : isToHost
                      ? 'bg-amber-950/40 border border-amber-500/30 text-amber-100 rounded-tl-sm'
                      : 'bg-dark-card border border-white/10 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Reactions Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/5 bg-dark-surface/40">
        <span className="text-[10px] uppercase font-semibold text-slate-500">Quick React:</span>
        <div className="flex items-center space-x-1.5">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() =>
                onSendMessage(
                  emoji,
                  selectedRecipient === 'everyone' ? undefined : selectedRecipient
                )
              }
              className="rounded-lg p-1 text-sm hover:bg-white/10 hover:scale-125 transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Message Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3.5 bg-dark-card/90">
        {/* Recipient status indicator above input */}
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center space-x-1">
            <span>To:</span>
            {selectedRecipient === 'host' ? (
              <span className="font-bold text-amber-300 flex items-center space-x-1 bg-amber-500/20 px-1.5 py-0.5 rounded">
                <Shield className="h-3 w-3" />
                <span>Host (Private)</span>
              </span>
            ) : selectedRecipient === 'everyone' ? (
              <span className="font-bold text-cyan-300 flex items-center space-x-1 bg-cyan-500/20 px-1.5 py-0.5 rounded">
                <Globe className="h-3 w-3" />
                <span>Everyone</span>
              </span>
            ) : (
              <span className="font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">
                Direct Message
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() =>
              setSelectedRecipient(selectedRecipient === 'everyone' ? 'host' : 'everyone')
            }
            className="text-[10px] text-mivo-400 hover:text-mivo-300 underline"
          >
            Switch to {selectedRecipient === 'everyone' ? 'Host' : 'Everyone'}
          </button>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={
              selectedRecipient === 'host'
                ? 'Send private message to Host...'
                : 'Send message to Everyone...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className={`w-full rounded-xl bg-dark-bg border pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
              selectedRecipient === 'host'
                ? 'border-amber-500/40 focus:border-amber-400 focus:ring-amber-400'
                : 'border-white/10 focus:border-mivo-500 focus:ring-mivo-500'
            }`}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg text-white disabled:opacity-30 transition-all ${
              selectedRecipient === 'host'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/30'
                : 'bg-mivo-600 hover:bg-mivo-500 shadow-md shadow-mivo-600/30'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
