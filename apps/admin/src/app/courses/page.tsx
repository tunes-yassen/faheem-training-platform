'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  Plus,
  CheckCircle2,
  XCircle,
  Video,
  MapPin,
  PlayCircle,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { CertificateRecord, CourseItem } from '@/lib/types';
import { cn, formatSAR } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

export default function CoursesLmsPage() {
  const { courses, setCourses, certificates, setCertificates, notify, appendAuditLog } = useAdmin();
  const [tab, setTab] = useState<'courses' | 'certificates'>('courses');
  const [createOpen, setCreateOpen] = useState(false);
  const [issueCertOpen, setIssueCertOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<CertificateRecord | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const [courseForm, setCourseForm] = useState({
    title: '',
    category: 'التقنية والبيانات',
    deliveryMode: 'LIVE_ONLINE' as CourseItem['deliveryMode'],
    trainerName: '',
    priceSar: 1200,
    hours: 20,
    capacity: 40,
  });

  const [certForm, setCertForm] = useState({
    studentName: '',
    courseTitle: courses[0]?.title || '',
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim()) return;
    const item: CourseItem = {
      id: `crs-${Date.now()}`,
      ...courseForm,
      cohortsCount: 1,
      enrolledCount: 0,
      completionRate: 0,
      ncelSynced: true,
      status: 'PUBLISHED',
    };
    setCourses((prev) => [item, ...prev]);
    await apiRequest('/lms/courses', { method: 'POST', body: JSON.stringify(item) });
    appendAuditLog({
      module: 'الدورات والشهادات (LMS)',
      action: 'COURSE_CREATED',
      severity: 'INFO',
      summary: `إنشاء دورة تدريبية جديدة "${item.title}" (${item.deliveryMode})`,
    });
    notify('تم إنشاء الدورة التدريبية ونشرها');
    setCreateOpen(false);
    setCourseForm({
      title: '',
      category: 'التقنية والبيانات',
      deliveryMode: 'LIVE_ONLINE',
      trainerName: '',
      priceSar: 1200,
      hours: 20,
      capacity: 40,
    });
  };

  const handleIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.studentName.trim()) return;
    const serial = `FHM-2026-${Math.floor(10000 + Math.random() * 89999)}`;
    const cert: CertificateRecord = {
      id: `cert-${Date.now()}`,
      serialCode: serial,
      studentName: certForm.studentName.trim(),
      courseTitle: certForm.courseTitle,
      issuedAt: new Date().toISOString().slice(0, 10),
      status: 'VALID',
      ncelReported: true,
    };
    setCertificates((prev) => [cert, ...prev]);
    await apiRequest('/lms/certificates/issue', { method: 'POST', body: JSON.stringify(cert) });
    appendAuditLog({
      module: 'الدورات والشهادات (LMS)',
      action: 'CERTIFICATE_ISSUED',
      severity: 'INFO',
      summary: `إصدار شهادة رقم ${serial} للمتدرب ${cert.studentName}`,
    });
    notify(`تم إصدار الشهادة ${serial} بنجاح`);
    setIssueCertOpen(false);
    setCertForm({ studentName: '', courseTitle: courses[0]?.title || '' });
  };

  const handleRevokeCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeTarget || !revokeReason.trim()) return;
    setCertificates((prev) =>
      prev.map((c) =>
        c.id === revokeTarget.id
          ? { ...c, status: 'REVOKED', revokeReason: revokeReason.trim() }
          : c
      )
    );
    appendAuditLog({
      module: 'الدورات والشهادات (LMS)',
      action: 'CERTIFICATE_REVOKED',
      severity: 'CRITICAL',
      summary: `إلغاء وسحب الشهادة ${revokeTarget.serialCode} — السبب: ${revokeReason.trim()}`,
    });
    notify('تم إلغاء الشهادة وتحديث حالة التحقق العام', 'warning');
    setRevokeTarget(null);
    setRevokeReason('');
  };

  const deliveryBadge = (mode: CourseItem['deliveryMode']) => {
    if (mode === 'IN_PERSON')
      return (
        <Badge variant="amber">
          <MapPin className="h-3 w-3" /> حضوري
        </Badge>
      );
    if (mode === 'LIVE_ONLINE')
      return (
        <Badge variant="teal">
          <Video className="h-3 w-3" /> مباشر أونلاين
        </Badge>
      );
    return (
      <Badge variant="sky">
        <PlayCircle className="h-3 w-3" /> مسجل ذاتي
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الدورات التدريبية والشهادات (LMS)"
        subtitle="إدارة الدورات (حضوري، مباشر أونلاين، مسجل)، الدفعات والمقاعد، نسب الإتمام، وإصدار أو إلغاء الشهادات المربوطة بالمركز الوطني NCEL."
        actions={
          <>
            <button onClick={() => setIssueCertOpen(true)} className="btn-secondary">
              <Award className="h-4 w-4 text-teal-600" /> إصدار شهادة
            </button>
            <button onClick={() => setCreateOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> دورة تدريبية جديدة
            </button>
          </>
        }
      />

      <div className="inline-flex rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
        <button
          onClick={() => setTab('courses')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'courses' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <GraduationCap className="h-4 w-4" /> الدورات والدفعات ({courses.length})
        </button>
        <button
          onClick={() => setTab('certificates')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'certificates'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <Award className="h-4 w-4" /> سجل الشهادات و QR ({certificates.length})
        </button>
      </div>

      {tab === 'courses' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(courses ?? []).map((course) => {
            const safeCap = course.capacity && course.capacity > 0 ? course.capacity : 1;
            const fillPct = Math.min(100, Math.round(((course.enrolledCount || 0) / safeCap) * 100));
            return (
              <div key={course.id} className="surface-card p-5 transition-all hover:border-teal-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {deliveryBadge(course.deliveryMode)}
                    <Badge variant="slate">{course.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.ncelSynced && <Badge variant="emerald">مربوط NCEL</Badge>}
                    <Badge variant={course.status === 'PUBLISHED' ? 'teal' : 'amber'}>
                      {course.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                    </Badge>
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-bold text-slate-900">
                  {course.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  المدرب: <span className="font-semibold text-slate-700">{course.trainerName}</span> •{' '}
                  {course.hours} ساعة تدريبية • {course.cohortsCount} دفعات
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-center">
                  <div>
                    <p className="text-[11px] text-slate-500">رسوم التسجيل</p>
                    <p className="mt-0.5 text-sm font-extrabold text-teal-700">
                      {formatSAR(course.priceSar)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">المسجلون / السعة</p>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                      {course.enrolledCount} / {course.capacity}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">معدل الإتمام</p>
                    <p className="mt-0.5 text-sm font-extrabold text-sky-700">
                      {course.completionRate}%
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                    <span>إشغال المقاعد</span>
                    <span>{fillPct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-teal-500 to-sky-500"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'certificates' && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">الرقم التسلسلي / QR</th>
                  <th className="px-5 py-3.5">المتدرب</th>
                  <th className="px-5 py-3.5">الدورة التدريبية</th>
                  <th className="px-5 py-3.5">تاريخ الإصدار</th>
                  <th className="px-5 py-3.5">الحالة</th>
                  <th className="px-5 py-3.5">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-teal-700">
                        <QrCode className="h-4 w-4" /> {cert.serialCode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{cert.studentName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{cert.courseTitle}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500" dir="ltr">
                      {cert.issuedAt}
                    </td>
                    <td className="px-5 py-3.5">
                      {cert.status === 'VALID' ? (
                        <Badge variant="emerald">
                          <CheckCircle2 className="h-3.5 w-3.5" /> سارية وموثقة
                        </Badge>
                      ) : (
                        <div>
                          <Badge variant="rose">
                            <XCircle className="h-3.5 w-3.5" /> ملغاة
                          </Badge>
                          {cert.revokeReason && (
                            <p className="mt-1 text-[11px] text-rose-600">{cert.revokeReason}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {cert.status === 'VALID' && (
                        <button
                          onClick={() => setRevokeTarget(cert)}
                          className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                        >
                          إلغاء الشهادة
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Course Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="إضافة دورة تدريبية جديدة">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">عنوان الدورة</label>
            <input
              required
              value={courseForm.title}
              onChange={(e) => setCourseForm((s) => ({ ...s, title: e.target.value }))}
              className="input-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">نمط التقديم</label>
              <select
                value={courseForm.deliveryMode}
                onChange={(e) =>
                  setCourseForm((s) => ({
                    ...s,
                    deliveryMode: e.target.value as CourseItem['deliveryMode'],
                  }))
                }
                className="input-base"
              >
                <option value="LIVE_ONLINE">مباشر أونلاين</option>
                <option value="IN_PERSON">حضوري</option>
                <option value="RECORDED">مسجل ذاتي</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">المدرب المعتمد</label>
              <input
                required
                value={courseForm.trainerName}
                onChange={(e) => setCourseForm((s) => ({ ...s, trainerName: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">السعر (ر.س)</label>
              <input
                type="number"
                value={courseForm.priceSar}
                onChange={(e) => setCourseForm((s) => ({ ...s, priceSar: Number(e.target.value) }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">السعة القصوى للمقاعد</label>
              <input
                type="number"
                value={courseForm.capacity}
                onChange={(e) => setCourseForm((s) => ({ ...s, capacity: Number(e.target.value) }))}
                className="input-base"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              إنشاء ونشر الدورة
            </button>
          </div>
        </form>
      </Modal>

      {/* Issue Cert Modal */}
      <Modal open={issueCertOpen} onClose={() => setIssueCertOpen(false)} title="إصدار شهادة معتمدة">
        <form onSubmit={handleIssueCert} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">اسم المتدرب</label>
            <input
              required
              value={certForm.studentName}
              onChange={(e) => setCertForm((s) => ({ ...s, studentName: e.target.value }))}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">الدورة التدريبية</label>
            <select
              value={certForm.courseTitle}
              onChange={(e) => setCertForm((s) => ({ ...s, courseTitle: e.target.value }))}
              className="input-base"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.title}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIssueCertOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              إصدار وتوليد QR
            </button>
          </div>
        </form>
      </Modal>

      {/* Revoke Cert Modal */}
      <Modal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="إلغاء وسحب شهادة صادرة"
        subtitle={revokeTarget ? `الرقم التسلسلي: ${revokeTarget.serialCode}` : undefined}
      >
        <form onSubmit={handleRevokeCert} className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>سيظهر للمتحقق عبر رمز QR أن هذه الشهادة ملغاة فوراً. يرجى توثيق السبب النظامي.</span>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">سبب الإلغاء (إلزامي)</label>
            <textarea
              required
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="مثال: عدم استيفاء متطلبات الحضور بعد التدقيق..."
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRevokeTarget(null)} className="btn-secondary">
              تراجع
            </button>
            <button type="submit" className="btn-danger">
              تأكيد الإلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
