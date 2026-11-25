'use client';

import React, { useState } from 'react';
import { ScrollText, Search, Download, Lock, Eye } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { AuditLogEntry } from '@/lib/types';
import { exportToCSV } from '@/lib/utils';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

export default function AuditLogsPage() {
  const { auditLogs } = useAdmin();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [inspectLog, setInspectLog] = useState<AuditLogEntry | null>(null);

  const filtered = auditLogs.filter((log) => {
    const matchSev = severityFilter === 'ALL' || log.severity === severityFilter;
    const matchSearch =
      !search.trim() ||
      log.summary.includes(search) ||
      log.actorName.includes(search) ||
      log.module.includes(search) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل التدقيق الأمني غير القابل للتعديل (Audit Logs)"
        subtitle="توثيق فوري ودائم لكل عملية إدارية حساسة (تعديل مفاتيح API، الصلاحيات، الاسترداد المالي، واعتماد المعلمين)."
        badge={
          <Badge variant="emerald">
            <Lock className="h-3.5 w-3.5" /> للقراءة فقط (Immutable)
          </Badge>
        }
        actions={
          <button
            onClick={() =>
              exportToCSV('faheem-audit-logs.csv', filtered as unknown as Record<string, unknown>[], [
                { key: 'timestamp', label: 'الوقت' },
                { key: 'actorName', label: 'المنفّذ' },
                { key: 'module', label: 'الوحدة' },
                { key: 'action', label: 'الإجراء' },
                { key: 'severity', label: 'المستوى' },
                { key: 'summary', label: 'الملخص' },
                { key: 'ipAddress', label: 'عنوان IP' },
              ])
            }
            className="btn-secondary"
          >
            <Download className="h-4 w-4 text-teal-600" /> تصدير السجل CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
          {[
            { key: 'ALL', label: 'جميع المستويات' },
            { key: 'CRITICAL', label: 'حرج (Critical)' },
            { key: 'WARNING', label: 'تنبيه (Warning)' },
            { key: 'INFO', label: 'معلوماتي (Info)' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSeverityFilter(s.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                severityFilter === s.key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالمنفّذ، الوحدة، أو الإجراء..."
            className="input-base pr-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">الوقت</th>
                <th className="px-5 py-3.5">المنفّذ</th>
                <th className="px-5 py-3.5">الوحدة</th>
                <th className="px-5 py-3.5">الإجراء</th>
                <th className="px-5 py-3.5">الملخص</th>
                <th className="px-5 py-3.5">IP</th>
                <th className="px-5 py-3.5">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-slate-500" dir="ltr">
                    {log.timestamp}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{log.actorName}</p>
                    <p className="text-[11px] text-slate-400">{log.actorRole}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{log.module}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant={
                        log.severity === 'CRITICAL'
                          ? 'rose'
                          : log.severity === 'WARNING'
                          ? 'amber'
                          : 'teal'
                      }
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="max-w-md px-5 py-3.5 text-xs text-slate-700">{log.summary}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400" dir="ltr">
                    {log.ipAddress}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setInspectLog(log)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> فحص
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Diff Modal */}
      <Modal
        open={!!inspectLog}
        onClose={() => setInspectLog(null)}
        title="تفاصيل سجل التدقيق الأمني"
        subtitle={inspectLog ? `${inspectLog.action} • ${inspectLog.timestamp}` : undefined}
      >
        {inspectLog && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs">
              <p className="font-bold text-slate-900">{inspectLog.summary}</p>
              <p className="mt-1 text-slate-500">
                المنفّذ: {inspectLog.actorName} ({inspectLog.actorRole}) • IP: {inspectLog.ipAddress}
              </p>
            </div>
            {inspectLog.before && (
              <div>
                <p className="mb-1 text-xs font-bold text-slate-600">القيم السابقة (Before)</p>
                <pre
                  dir="ltr"
                  className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-amber-300"
                >
                  {JSON.stringify(inspectLog.before, null, 2)}
                </pre>
              </div>
            )}
            {inspectLog.after && (
              <div>
                <p className="mb-1 text-xs font-bold text-slate-600">القيم الجديدة (After)</p>
                <pre
                  dir="ltr"
                  className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-300"
                >
                  {JSON.stringify(inspectLog.after, null, 2)}
                </pre>
              </div>
            )}
            {!inspectLog.before && !inspectLog.after && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-xs text-slate-500">
                <ScrollText className="h-4 w-4 text-slate-400" />
                <span>لا توجد بيانات JSON تفصيلية مرفقة بهذا الحدث.</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
