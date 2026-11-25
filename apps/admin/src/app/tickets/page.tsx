'use client';

import React, { useState } from 'react';
import { LifeBuoy, Clock, AlertTriangle, CheckCircle2, MessageSquareReply } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { SupportTicket } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

export default function SupportTicketsPage() {
  const { tickets, setTickets, notify, appendAuditLog } = useAdmin();
  const [replyTarget, setReplyTarget] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyText.trim()) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === replyTarget.id
          ? { ...t, status: 'RESOLVED', lastMessage: `رد الدعم: ${replyText.trim()}` }
          : t
      )
    );
    await apiRequest(`/portals/tickets/${replyTarget.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'RESOLVED', reply: replyText.trim() }),
    });
    appendAuditLog({
      module: 'الدعم الفني و SLA',
      action: 'TICKET_RESOLVED',
      severity: 'INFO',
      summary: `معالجة وإغلاق التذكرة ${replyTarget.code} (${replyTarget.subject})`,
    });
    notify(`تم إرسال الرد وإغلاق التذكرة ${replyTarget.code}`);
    setReplyTarget(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="تذاكر الدعم الفني ومؤشر SLA"
        subtitle="متابعة تذاكر الطلاب وأولياء الأمور والمعلمين مع تنبيهات استباقية لمستوى الخدمة SLA."
        badge={
          <Badge variant="amber">
            <LifeBuoy className="h-3.5 w-3.5" /> {tickets.filter((t) => t.status !== 'RESOLVED').length}{' '}
            تذاكر نشطة
          </Badge>
        }
      />

      <div className="space-y-3">
        {tickets.map((tkt) => (
          <div
            key={tkt.id}
            className="surface-card flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-teal-700">{tkt.code}</span>
                <Badge
                  variant={
                    tkt.priority === 'URGENT'
                      ? 'rose'
                      : tkt.priority === 'HIGH'
                      ? 'amber'
                      : 'sky'
                  }
                >
                  {tkt.priority === 'URGENT'
                    ? 'عاجل جداً'
                    : tkt.priority === 'HIGH'
                    ? 'مرتفع'
                    : 'متوسط'}
                </Badge>
                <Badge variant={tkt.status === 'RESOLVED' ? 'emerald' : 'slate'}>
                  {tkt.status === 'RESOLVED'
                    ? 'تم الحل'
                    : tkt.status === 'IN_PROGRESS'
                    ? 'قيد المعالجة'
                    : 'مفتوحة'}
                </Badge>
                {tkt.slaBreached ? (
                  <Badge variant="rose">
                    <AlertTriangle className="h-3 w-3" /> {tkt.slaRemaining}
                  </Badge>
                ) : (
                  <Badge variant="teal">
                    <Clock className="h-3 w-3" /> {tkt.slaRemaining}
                  </Badge>
                )}
              </div>

              <h3 className="font-display text-base font-bold text-slate-900">{tkt.subject}</h3>
              <p className="text-xs text-slate-600">{tkt.lastMessage}</p>
              <p className="text-[11px] text-slate-400">
                مقدم الطلب: <strong className="text-slate-600">{tkt.requesterName}</strong> (
                {tkt.requesterRole}) • {tkt.createdAt}
              </p>
            </div>

            <div className="shrink-0">
              {tkt.status !== 'RESOLVED' ? (
                <button
                  onClick={() => {
                    setReplyTarget(tkt);
                    setReplyText('');
                  }}
                  className="btn-primary text-xs"
                >
                  <MessageSquareReply className="h-4 w-4" /> رد وإغلاق التذكرة
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> مغلقة وموثقة
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        title={`الرد على التذكرة ${replyTarget?.code}`}
        subtitle={replyTarget?.subject}
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">نص الرد والإجراء المتخذ</label>
            <textarea
              required
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="اكتب الرد الذي سيصل للمستخدم عبر التطبيق والبريد..."
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReplyTarget(null)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              إرسال الرد وإغلاق التذكرة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
