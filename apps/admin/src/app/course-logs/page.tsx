'use client';

import React, { useState } from 'react';
import {
  Activity,
  Download,
  Search,
  UserPlus,
  CheckCircle2,
  WifiOff,
  Award,
  FileCheck,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { CourseActivityLog } from '@/lib/governance-types';
import { cn, exportToCSV } from '@/lib/utils';
import { Badge, PageHeader } from '@/components/ui/Primitives';

const EVENT_META: Record<
  CourseActivityLog['eventType'],
  { label: string; variant: 'teal' | 'sky' | 'amber' | 'rose' | 'emerald'; icon: React.ComponentType<{ className?: string }> }
> = {
  ENROLLMENT: { label: 'تسجيل مقعد', variant: 'sky', icon: UserPlus },
  ATTENDANCE: { label: 'رصد حضور', variant: 'teal', icon: CheckCircle2 },
  INTERRUPTION: { label: 'انقطاع فصل افتراضي', variant: 'rose', icon: WifiOff },
  GRADE_CHANGE: { label: 'تعديل درجة/تقييم', variant: 'amber', icon: FileCheck },
  CERTIFICATE: { label: 'إصدار/إلغاء شهادة', variant: 'emerald', icon: Award },
};

export default function CourseLogsPage() {
  const { courseLogs } = useAdmin();
  const [typeFilter, setTypeFilter] = useState<'ALL' | CourseActivityLog['eventType']>('ALL');
  const [search, setSearch] = useState('');

  const filtered = courseLogs.filter((l) => {
    const matchType = typeFilter === 'ALL' || l.eventType === typeFilter;
    const matchSearch =
      !search.trim() ||
      l.courseTitle.includes(search) ||
      l.cohortName.includes(search) ||
      l.actorName.includes(search) ||
      l.details.includes(search);
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجلات الدورات والعمليات التشغيلية (Course Logs)"
        subtitle="الخط الزمني الشامل لتنفيذ الدورات والجلسات: التسجيل، رصد الحضور، انقطاعات الفصول الافتراضية، تعديلات الدرجات، وإصدار الشهادات."
        badge={
          <Badge variant="teal">
            <Activity className="h-3.5 w-3.5" /> {filtered.length} حدث مسجل
          </Badge>
        }
        actions={
          <button
            onClick={() =>
              exportToCSV('faheem-course-logs.csv', filtered as unknown as Record<string, unknown>[], [
                { key: 'timestamp', label: 'الوقت' },
                { key: 'courseTitle', label: 'الدورة' },
                { key: 'cohortName', label: 'الدفعة' },
                { key: 'eventType', label: 'نوع الحدث' },
                { key: 'actorName', label: 'المنفّذ' },
                { key: 'details', label: 'التفاصيل' },
              ])
            }
            className="btn-secondary"
          >
            <Download className="h-4 w-4 text-teal-600" /> تصدير CSV
          </button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
          {(['ALL', 'ENROLLMENT', 'ATTENDANCE', 'INTERRUPTION', 'GRADE_CHANGE', 'CERTIFICATE'] as const).map(
            (ev) => (
              <button
                key={ev}
                onClick={() => setTypeFilter(ev)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                  typeFilter === ev ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {ev === 'ALL' ? 'الكل' : EVENT_META[ev].label}
              </button>
            )
          )}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الدورة، الدفعة، أو المنفّذ..."
            className="input-base pr-9 text-xs"
          />
        </div>
      </div>

      {/* Chronological Timeline Cards */}
      <div className="space-y-3">
        {filtered.map((log) => {
          const meta = EVENT_META[log.eventType];
          const Icon = meta.icon;
          return (
            <div
              key={log.id}
              className="surface-card flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <span className="font-display text-sm font-bold text-slate-900">
                      {log.courseTitle}
                    </span>
                    <span className="text-xs text-slate-400">({log.cohortName})</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{log.details}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    المنفّذ / المصدر: <strong className="text-slate-700">{log.actorName}</strong>
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs text-slate-400" dir="ltr">
                {log.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
