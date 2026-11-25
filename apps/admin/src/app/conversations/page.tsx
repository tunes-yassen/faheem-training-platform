'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  PhoneCall,
  StickyNote,
  Search,
  Archive,
  ShieldCheck,
  Clock,
  Users,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { ConversationThread } from '@/lib/governance-types';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

const TYPE_META: Record<
  ConversationThread['type'],
  { label: string; variant: 'teal' | 'sky' | 'amber'; icon: React.ComponentType<{ className?: string }> }
> = {
  CHAT: { label: 'محادثة منصة', variant: 'teal', icon: MessageSquare },
  CALL_LOG: { label: 'سجل مكالمة', variant: 'sky', icon: PhoneCall },
  COORDINATOR_NOTE: { label: 'ملاحظة منسق', variant: 'amber', icon: StickyNote },
};

export default function ConversationsOversightPage() {
  const { conversations, setConversations, notify, appendAuditLog } = useAdmin();
  const [typeFilter, setTypeFilter] = useState<'ALL' | ConversationThread['type']>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(conversations[0]?.id || '');
  const [archiveTarget, setArchiveTarget] = useState<ConversationThread | null>(null);
  const [archiveReason, setArchiveReason] = useState('');

  const filtered = conversations.filter((c) => {
    const matchType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchSearch =
      !search.trim() ||
      c.subject.includes(search) ||
      c.participants.some((p) => p.name.includes(search)) ||
      c.messages.some((m) => m.content.includes(search));
    return matchType && matchSearch;
  });

  const activeThread = filtered.find((c) => c.id === selectedId) || filtered[0] || null;

  const handleArchiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveTarget || !archiveReason.trim()) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === archiveTarget.id
          ? { ...c, archived: true, archiveReason: archiveReason.trim() }
          : c
      )
    );
    await apiRequest(`/admin/conversations/${archiveTarget.id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason: archiveReason.trim() }),
    });
    appendAuditLog({
      module: 'سجلات المحادثات والاتصالات',
      action: 'CONVERSATION_ARCHIVED',
      severity: 'CRITICAL',
      summary: `أرشفة/إخفاء المحادثة "${archiveTarget.subject}" (صلاحية المدير العام) — السبب: ${archiveReason.trim()}`,
    });
    notify('تمت أرشفة المحادثة وتوثيق القرار في سجل التدقيق', 'warning');
    setArchiveTarget(null);
    setArchiveReason('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجلات المحادثات والاتصالات (Oversight Center)"
        subtitle="رقابة مركزية للمدير العام على جميع محادثات المنصة، سجلات مكالمات خدمة العملاء، وملاحظات المنسقين مع أرشفة موثقة أمنياً."
        badge={
          <Badge variant="teal">
            <ShieldCheck className="h-3.5 w-3.5" /> رقابة المدير العام
          </Badge>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
          {[
            { key: 'ALL', label: 'الكل' },
            { key: 'CHAT', label: 'محادثات المنصة (CHAT)' },
            { key: 'CALL_LOG', label: 'سجلات المكالمات (CALL_LOG)' },
            { key: 'COORDINATOR_NOTE', label: 'ملاحظات المنسقين' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key as typeof typeFilter)}
              className={cn(
                'rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                typeFilter === t.key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالموضوع، المشارك، أو نص الرسالة..."
            className="input-base pr-9 text-xs"
          />
        </div>
      </div>

      {/* Master-Detail View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Thread List */}
        <div className="space-y-3 lg:col-span-5">
          {filtered.map((conv) => {
            const meta = TYPE_META[conv.type];
            const Icon = meta.icon;
            const isSel = activeThread?.id === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  'surface-card block w-full p-4 text-right transition-all',
                  isSel ? 'border-teal-500 ring-2 ring-teal-500/20' : 'hover:border-slate-300',
                  conv.archived && 'opacity-70'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={meta.variant}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    {conv.archived && <Badge variant="rose">مؤرشفة</Badge>}
                    <span className="font-mono text-[10px] text-slate-400" dir="ltr">
                      {conv.lastMessageAt}
                    </span>
                  </div>
                </div>
                <p className="mt-2 font-display text-sm font-bold text-slate-900">{conv.subject}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  {conv.participants.map((p) => `${p.name} (${p.role})`).join(' ↔ ')}
                </p>
              </button>
            );
          })}
        </div>

        {/* Message Viewer */}
        <div className="surface-card flex flex-col justify-between p-6 lg:col-span-7">
          {activeThread ? (
            <>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={TYPE_META[activeThread.type].variant}>
                        {TYPE_META[activeThread.type].label}
                      </Badge>
                      {activeThread.durationSeconds && (
                        <Badge variant="slate">
                          <Clock className="h-3 w-3" /> {Math.floor(activeThread.durationSeconds / 60)}د{' '}
                          {activeThread.durationSeconds % 60}ث
                        </Badge>
                      )}
                    </div>
                    <h2 className="mt-2 font-display text-base font-bold text-slate-900">
                      {activeThread.subject}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      الأطراف:{' '}
                      {activeThread.participants.map((p) => `${p.name} (${p.role})`).join(' • ')}
                    </p>
                  </div>

                  {!activeThread.archived && (
                    <button
                      onClick={() => {
                        setArchiveTarget(activeThread);
                        setArchiveReason('');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      <Archive className="h-3.5 w-3.5" /> أرشفة / حذف موثق (Super Admin)
                    </button>
                  )}
                </div>

                {activeThread.archived && activeThread.archiveReason && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <strong>تمت الأرشفة بواسطة المدير العام:</strong> {activeThread.archiveReason}
                  </div>
                )}

                <div className="mt-5 space-y-3">
                  {activeThread.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          {msg.senderName}{' '}
                          <span className="font-normal text-teal-700">({msg.senderRole})</span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-400" dir="ltr">
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">
              لا توجد محادثات مطابقة للبحث الحالي.
            </p>
          )}
        </div>
      </div>

      {/* Audited Archive Modal */}
      <Modal
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title="أرشفة / حذف سجل محادثة (صلاحية المدير العام)"
        subtitle="يتم تسجيل هذا الإجراء مع السبب في سجل التدقيق الأمني غير القابل للحذف."
      >
        <form onSubmit={handleArchiveSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              سبب الأرشفة / الحذف (إلزامي)
            </label>
            <textarea
              required
              rows={3}
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="مثال: انتهاء النزاع وأرشفة السجل وفق سياسة الاحتفاظ بالبيانات..."
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setArchiveTarget(null)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-danger">
              تأكيد الأرشفة الموثقة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
