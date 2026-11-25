'use client';

import React, { useEffect, useState } from 'react';
import {
  Inbox,
  UserPlus,
  Headphones,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import { ConversationsPanel } from '@/components/ConversationsPanel';
import { DEMO_LESSON_REQUESTS, DEMO_TICKETS, DEMO_TUTORS } from '@/lib/demo-data';
import { api } from '@/lib/api';
import type { LessonRequest, SupportTicket } from '@/types';

export default function CoordinatorPortalPage() {
  const [tab, setTab] = useState('inbox');
  const [requests, setRequests] = useState<LessonRequest[]>(DEMO_LESSON_REQUESTS);
  const [tickets, setTickets] = useState<SupportTicket[]>(DEMO_TICKETS);
  const [selectedTutorByReq, setSelectedTutorByReq] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.getLessonRequests().then(setRequests);
    api.getTickets().then(setTickets);
  }, []);

  const handleAssignTutor = (reqId: string) => {
    const tutorId = selectedTutorByReq[reqId] || DEMO_TUTORS[0].id;
    const tutor = DEMO_TUTORS.find((t) => t.id === tutorId) || DEMO_TUTORS[0];
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'CONFIRMED', tutorName: tutor.name } : r)),
    );
    setNotice(`تم إسناد الطلب ${reqId} إلى ${tutor.name} وإرسال إشعار للطالب والمعلم.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleResolveTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'RESOLVED', slaRemaining: 'مغلق ضمن SLA' } : t)),
    );
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const openTickets = tickets.filter((t) => t.status !== 'RESOLVED');

  return (
    <PortalShell
      portalTitle="بوابة المنسق الأكاديمي"
      portalSubtitle="صندوق طلبات التقوية، الإسناد اليدوي للمعلمين، ومراقبة SLA التذاكر"
      roleBadge="منسق"
      accent="azure"
      activeTab={tab}
      onTabChange={setTab}
      tabs={[
        { id: 'inbox', label: 'صندوق الطلبات', icon: <Inbox className="h-4 w-4" />, badge: pendingRequests.length },
        { id: 'assign', label: 'الإسناد اليدوي للمعلمين', icon: <UserPlus className="h-4 w-4" /> },
        { id: 'conversations', label: 'المحادثات وسجل المكالمات', icon: <MessageSquare className="h-4 w-4" /> },
        { id: 'sla', label: 'تذاكر الدعم و SLA', icon: <Headphones className="h-4 w-4" />, badge: openTickets.length },
      ]}
    >
      {notice && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* REQUESTS INBOX */}
      {tab === 'inbox' && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            جميع طلبات دروس التقوية الواردة
          </h2>
          {requests.map((r) => (
            <div key={r.id} className="glass-card rounded-3xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={r.path === 'COORDINATOR' ? 'badge-azure' : r.path === 'OPEN_AUTO_MATCH' ? 'badge-amber' : 'badge-teal'}>
                      {r.path === 'COORDINATOR' ? 'طلب تنسيق منسق' : r.path === 'OPEN_AUTO_MATCH' ? 'طلب مفتوح' : 'حجز مباشر'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">{r.id}</span>
                  </div>
                  <h3 className="mt-2 font-heading text-base font-extrabold text-slate-900">
                    {r.studentName} — {r.subject} ({r.grade})
                  </h3>
                  <p className="text-xs text-slate-500">
                    الموعد: {r.preferredTime} • {r.mode === 'ONLINE' ? 'أونلاين' : 'حضوري'}
                    {r.tutorName ? ` • المعلم: ${r.tutorName}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={r.status === 'CONFIRMED' ? 'badge-teal' : 'badge-amber'}>
                    {r.status === 'CONFIRMED' ? 'تم الإسناد' : 'بانتظار المعالجة'}
                  </span>
                  {r.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => setTab('assign')}
                      className="btn-secondary py-2 px-3.5 text-xs"
                    >
                      إسناد معلم
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MANUAL TUTOR ASSIGNMENT */}
      {tab === 'assign' && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            الإسناد اليدوي للمعلمين المعتمدين
          </h2>
          {pendingRequests.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-sm font-bold text-emerald-700">
              جميع الطلبات المعلقة تم إسنادها بنجاح!
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.id} className="glass-card rounded-3xl p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-heading text-base font-extrabold text-slate-900">
                      {req.studentName} — {req.subject} ({req.grade})
                    </p>
                    <p className="text-xs text-slate-500">
                      {req.id} • الموعد: {req.preferredTime} • {req.notes || 'بدون ملاحظات إضافية'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedTutorByReq[req.id] || DEMO_TUTORS[0].id}
                      onChange={(e) =>
                        setSelectedTutorByReq((prev) => ({ ...prev, [req.id]: e.target.value }))
                      }
                      className="input-field w-60 py-2 text-xs"
                    >
                      {DEMO_TUTORS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.subjects[0]} ({t.rating}★)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAssignTutor(req.id)}
                      className="btn-primary py-2.5 px-4 text-xs"
                    >
                      تأكيد الإسناد
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CONVERSATIONS & CALL LOGS */}
      {tab === 'conversations' && (
        <ConversationsPanel
          currentUserName="ريم الحربي"
          currentUserRole="منسق أكاديمي"
          allowCoordinatorNote
        />
      )}

      {/* SUPPORT TICKETS & SLA MONITOR */}
      {tab === 'sla' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500">تذاكر مفتوحة</p>
              <p className="mt-1 font-heading text-2xl font-black text-amber-600">{openTickets.length}</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500">الالتزام بـ SLA</p>
              <p className="mt-1 font-heading text-2xl font-black text-emerald-600">97.4%</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500">متوسط زمن الاستجابة</p>
              <p className="mt-1 font-heading text-2xl font-black text-azure-600">18 دقيقة</p>
            </div>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{t.id}</span>
                    {t.priority === 'HIGH' && t.status !== 'RESOLVED' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                        <AlertTriangle className="h-3 w-3" />
                        أولوية عالية
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{t.subject}</p>
                  <p className="text-xs text-slate-500">
                    مقدم الطلب: {t.requesterName || 'مستخدم'} • {t.category}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    {t.slaRemaining}
                  </span>
                  {t.status !== 'RESOLVED' ? (
                    <button
                      type="button"
                      onClick={() => handleResolveTicket(t.id)}
                      className="btn-primary py-2 px-4 text-xs"
                    >
                      إغلاق وحل
                    </button>
                  ) : (
                    <span className="badge-teal">تم الحل</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
