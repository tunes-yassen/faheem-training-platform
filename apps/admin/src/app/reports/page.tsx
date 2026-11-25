'use client';

import React from 'react';
import Link from 'next/link';
import { Download, FileSpreadsheet, ArrowUpLeft } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { exportToCSV } from '@/lib/utils';
import { PageHeader } from '@/components/ui/Primitives';

export default function ReportsHubPage() {
  const { ledger, settlements, staffReports, courseLogs, auditLogs, notify } = useAdmin();

  const reportCards = [
    {
      title: 'تقرير سجل المحفظة المالي (WalletLedger)',
      desc: `${ledger.length} قيد مالي غير قابل للتعديل`,
      href: '/finance',
      onExport: () => {
        exportToCSV('faheem-wallet-ledger.csv', ledger as unknown as Record<string, unknown>[]);
        notify('تم تصدير تقرير المحفظة بصيغة CSV');
      },
    },
    {
      title: 'كشف مستحقات وتسويات المعلمين',
      desc: `${settlements.length} تسوية مالية`,
      href: '/finance',
      onExport: () => {
        exportToCSV('faheem-settlements.csv', settlements as unknown as Record<string, unknown>[]);
        notify('تم تصدير كشف تسويات المعلمين');
      },
    },
    {
      title: 'تقارير المهام اليومية للموظفين وخدمة العملاء',
      desc: `${staffReports.length} تقرير إنجاز و SLA`,
      href: '/staff',
      onExport: () => {
        exportToCSV('faheem-staff-reports.csv', staffReports as unknown as Record<string, unknown>[]);
        notify('تم تصدير تقارير المهام اليومية');
      },
    },
    {
      title: 'سجلات الدورات والعمليات التشغيلية',
      desc: `${courseLogs.length} حدث تشغيلي للدورات`,
      href: '/course-logs',
      onExport: () => {
        exportToCSV('faheem-course-logs.csv', courseLogs as unknown as Record<string, unknown>[]);
        notify('تم تصدير سجلات الدورات');
      },
    },
    {
      title: 'سجل التدقيق الأمني الشامل (Audit Logs)',
      desc: `${auditLogs.length} عملية موثقة`,
      href: '/audit-logs',
      onExport: () => {
        exportToCSV('faheem-audit-logs.csv', auditLogs as unknown as Record<string, unknown>[]);
        notify('تم تصدير سجل التدقيق الأمني');
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="مركز التقارير والتصدير الشامل"
        subtitle="تصدير فوري لجميع التقارير المالية، التشغيلية، تقارير خدمة العملاء، وسجلات التدقيق بصيغة CSV متوافقة مع Excel."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((rc) => (
          <div key={rc.title} className="surface-card flex flex-col justify-between p-5">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="font-display text-sm font-bold text-slate-900">{rc.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{rc.desc}</p>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
              <button onClick={rc.onExport} className="btn-primary flex-1 py-2 text-xs">
                <Download className="h-3.5 w-3.5" /> تصدير CSV
              </button>
              <Link href={rc.href} className="btn-secondary py-2 text-xs">
                عرض <ArrowUpLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
