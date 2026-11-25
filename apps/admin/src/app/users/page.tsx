'use client';

import React, { useState } from 'react';
import { Search, Users2, ShieldBan, CheckCircle2, Link2 } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { PlatformUser } from '@/lib/types';
import { cn, formatSAR } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, PageHeader } from '@/components/ui/Primitives';

const ROLE_LABELS: Record<PlatformUser['role'], string> = {
  STUDENT: 'طالب',
  PARENT: 'ولي أمر',
  TUTOR: 'معلم تقوية',
  TRAINER: 'مدرب دورات',
  COORDINATOR: 'منسق أكاديمي',
  ADMIN: 'مشرف نظام',
};

export default function UsersDirectoryPage() {
  const { users, setUsers, notify, appendAuditLog } = useAdmin();
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchSearch =
      !search.trim() ||
      u.name.includes(search) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    return matchRole && matchSearch;
  });

  const toggleStatus = async (user: PlatformUser) => {
    const nextStatus: PlatformUser['status'] = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    await apiRequest(`/admin/users/${user.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    appendAuditLog({
      module: 'إدارة المستخدمين',
      action: nextStatus === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      severity: nextStatus === 'SUSPENDED' ? 'WARNING' : 'INFO',
      summary: `${nextStatus === 'SUSPENDED' ? 'إيقاف' : 'إعادة تفعيل'} حساب المستخدم ${user.name}`,
    });
    notify(
      nextStatus === 'SUSPENDED' ? `تم إيقاف حساب ${user.name}` : `تم تفعيل حساب ${user.name}`,
      nextStatus === 'SUSPENDED' ? 'warning' : 'success'
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="دليل المستخدمين والحسابات"
        subtitle="استعراض وإدارة جميع حسابات الطلاب، أولياء الأمور (مع الأبناء المرتبطين)، المعلمين، المدربين، والمنسقين."
        badge={
          <Badge variant="teal">
            <Users2 className="h-3.5 w-3.5" /> {users.length} مستخدم
          </Badge>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
          {['ALL', 'STUDENT', 'PARENT', 'TUTOR', 'TRAINER', 'COORDINATOR'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                roleFilter === r ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {r === 'ALL' ? 'الكل' : ROLE_LABELS[r as PlatformUser['role']]}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، البريد، أو الجوال..."
            className="input-base pr-9 text-xs"
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">المستخدم</th>
                <th className="px-5 py-3.5">الدور</th>
                <th className="px-5 py-3.5">التواصل</th>
                <th className="px-5 py-3.5">رصيد المحفظة</th>
                <th className="px-5 py-3.5">تاريخ الانضمام</th>
                <th className="px-5 py-3.5">الحالة</th>
                <th className="px-5 py-3.5">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    {user.linkedChildren && user.linkedChildren.length > 0 && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-teal-700">
                        <Link2 className="h-3 w-3" /> الأبناء: {user.linkedChildren.join('، ')}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="sky">{ROLE_LABELS[user.role]}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600" dir="ltr">
                    <p>{user.email}</p>
                    <p className="text-slate-400">{user.phone}</p>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    {formatSAR(user.walletBalanceSar)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500" dir="ltr">
                    {user.joinedAt}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={user.status === 'ACTIVE' ? 'emerald' : 'rose'}>
                      {user.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleStatus(user)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors',
                        user.status === 'ACTIVE'
                          ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      )}
                    >
                      {user.status === 'ACTIVE' ? (
                        <>
                          <ShieldBan className="h-3.5 w-3.5" /> إيقاف
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> تفعيل
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
