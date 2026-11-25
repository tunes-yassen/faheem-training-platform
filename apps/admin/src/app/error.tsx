'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function AdminGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin runtime boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="surface-card max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-bold text-slate-900">
          حدث خطأ غير متوقع في عرض الصفحة
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          تم احتواء الخطأ تلقائياً لحماية جلستك. يمكنك إعادة المحاولة فوراً.
        </p>
        <button onClick={reset} className="btn-primary mt-5 w-full">
          <RotateCcw className="h-4 w-4" /> إعادة تحميل الصفحة
        </button>
      </div>
    </div>
  );
}
