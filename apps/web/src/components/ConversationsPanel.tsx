'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  PhoneCall,
  FileText,
  Send,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DEMO_CONVERSATIONS } from '@/lib/demo-data';
import type { ConversationChannelType, ConversationThread } from '@/types';

const CHANNEL_META: Record<
  ConversationChannelType,
  { label: string; badge: string; icon: typeof MessageSquare }
> = {
  CHAT: { label: 'محادثة', badge: 'badge-teal', icon: MessageSquare },
  CALL_LOG: { label: 'سجل اتصال', badge: 'badge-azure', icon: PhoneCall },
  COORDINATOR_NOTE: { label: 'ملاحظة تنسيق', badge: 'badge-amber', icon: FileText },
};

export function ConversationsPanel({
  currentUserName,
  currentUserRole,
  allowCoordinatorNote = false,
}: {
  currentUserName: string;
  currentUserRole: string;
  allowCoordinatorNote?: boolean;
}) {
  const [threads, setThreads] = useState<ConversationThread[]>(DEMO_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string>(DEMO_CONVERSATIONS[0]?.id || '');
  const [filterType, setFilterType] = useState<'ALL' | ConversationChannelType>('ALL');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [draftType, setDraftType] = useState<ConversationChannelType>('CHAT');
  const [newOpen, setNewOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newRecipient, setNewRecipient] = useState('ريم الحربي (المنسق الأكاديمي)');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    api.getConversations().then((list) => {
      setThreads(list);
      if (list[0]) setSelectedId((prev) => prev || list[0].id);
    });
  }, []);

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const mType = filterType === 'ALL' || t.channelType === filterType;
      const mQuery =
        !search.trim() ||
        t.subject.includes(search.trim()) ||
        t.participantName.includes(search.trim());
      return mType && mQuery;
    });
  }, [threads, filterType, search]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === selectedId) || filteredThreads[0] || null,
    [threads, selectedId, filteredThreads],
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeThread) return;
    const text = draft.trim();
    setDraft('');
    const { message } = await api.sendConversationMessage(activeThread.id, {
      body: text,
      type: draftType,
      senderName: currentUserName,
      senderRole: currentUserRole,
    });
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, updatedAt: 'الآن', messages: [...t.messages, message] }
          : t,
      ),
    );
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    const { thread } = await api.createConversation({
      subject: newSubject.trim(),
      participantName: newRecipient,
      channelType: draftType,
      initialMessage: newMessage.trim(),
    });
    setThreads((prev) => [thread, ...prev]);
    setSelectedId(thread.id);
    setNewSubject('');
    setNewMessage('');
    setNewOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            المحادثات وسجل التواصل الموثق
          </h2>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            جميع المحادثات وسجلات الاتصال مؤرشفة ضمن حوكمة الجودة في منصة فهيم
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewOpen((v) => !v)}
          className="btn-primary py-2 px-4 text-xs"
        >
          <Plus className="h-4 w-4" />
          محادثة جديدة
        </button>
      </div>

      {/* New Thread Inline Panel */}
      {newOpen && (
        <form onSubmit={handleCreateThread} className="glass-card rounded-3xl p-5 space-y-3 border border-teal-200">
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm font-extrabold text-slate-900">بدء محادثة أو تسجيل تواصل جديد</p>
            <button type="button" onClick={() => setNewOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              className="input-field"
              placeholder="موضوع المحادثة..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <select
              className="input-field"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
            >
              <option>ريم الحربي (المنسق الأكاديمي)</option>
              <option>أ. نورة الشمري (معلم تقوية)</option>
              <option>م. خالد الدوسري (مدرب مهني)</option>
              <option>فريق خدمة العملاء والدعم</option>
            </select>
          </div>
          <textarea
            required
            rows={2}
            className="input-field"
            placeholder="اكتب رسالتك الأولى..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="btn-primary py-2 px-5 text-xs">
            إرسال وبدء المحادثة
          </button>
        </form>
      )}

      {/* Split Layout */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Threads List */}
        <div className="glass-card rounded-3xl p-4 lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في المحادثات..."
              className="input-field py-2.5 pr-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'CHAT', 'CALL_LOG', ...(allowCoordinatorNote ? ['COORDINATOR_NOTE'] : [])] as const).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t as 'ALL' | ConversationChannelType)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    filterType === t
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'ALL'
                    ? 'الكل'
                    : CHANNEL_META[t as ConversationChannelType].label}
                </button>
              ),
            )}
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pl-1">
            {filteredThreads.map((t) => {
              const meta = CHANNEL_META[t.channelType] || CHANNEL_META.CHAT;
              const isSelected = activeThread?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full rounded-2xl border p-3.5 text-right transition-all ${
                    isSelected
                      ? 'border-teal-400 bg-teal-50/70 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={meta.badge}>{meta.label}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{t.updatedAt}</span>
                  </div>
                  <p className="mt-2 line-clamp-1 font-heading text-sm font-extrabold text-slate-900">
                    {t.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t.participantName} • {t.participantRole}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages Viewer */}
        <div className="glass-card flex flex-col justify-between rounded-3xl p-5 lg:col-span-7 min-h-[420px]">
          {activeThread ? (
            <>
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-heading text-base font-extrabold text-slate-900">
                  {activeThread.subject}
                </h3>
                <p className="text-xs text-slate-500">
                  مع {activeThread.participantName} ({activeThread.participantRole})
                </p>
              </div>

              <div className="my-4 flex-1 space-y-3 overflow-y-auto max-h-[280px] pl-1">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.isMine ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        m.type === 'CALL_LOG'
                          ? 'border border-azure-200 bg-azure-50 text-slate-800'
                          : m.type === 'COORDINATOR_NOTE'
                            ? 'border border-amber-200 bg-sunlit-50 text-slate-800'
                            : m.isMine
                              ? 'bg-gradient-to-l from-teal-600 to-emerald-500 text-white'
                              : 'border border-slate-200/80 bg-white text-slate-800'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-[10px] opacity-80">
                        <span className="font-bold">{m.senderName}</span>
                        <span>{m.createdAt}</span>
                      </div>
                      <p>{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex gap-2">
                  {(['CHAT', 'CALL_LOG', ...(allowCoordinatorNote ? ['COORDINATOR_NOTE'] : [])] as const).map(
                    (typeOpt) => (
                      <button
                        key={typeOpt}
                        type="button"
                        onClick={() => setDraftType(typeOpt as ConversationChannelType)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                          draftType === typeOpt
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {CHANNEL_META[typeOpt as ConversationChannelType].label}
                      </button>
                    ),
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="اكتب رسالتك أو ملخص المكالمة..."
                    className="input-field flex-1 py-2.5 text-xs"
                  />
                  <button type="submit" className="btn-primary px-5 py-2.5 text-xs">
                    <Send className="h-4 w-4" />
                    إرسال
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              اختر محادثة لعرض التفاصيل
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
