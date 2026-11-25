'use client';

import React, { useState } from 'react';
import { Package, BookOpen, TrendingUp, Plus, Sparkles, Clock } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { SubjectItem, TutoringPackage } from '@/lib/types';
import { cn, formatSAR } from '@/lib/utils';
import { Badge, Modal, PageHeader, Switch } from '@/components/ui/Primitives';

export default function PackagesAndPricingPage() {
  const {
    packages,
    setPackages,
    subjects,
    setSubjects,
    pricingRules,
    setPricingRules,
    notify,
    appendAuditLog,
  } = useAdmin();

  const [tab, setTab] = useState<'packages' | 'subjects' | 'rules'>('packages');
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);

  const [newPkg, setNewPkg] = useState({
    name: '',
    sessionsCount: 8,
    sessionDurationMin: 60,
    priceSar: 790,
    originalPriceSar: 960,
    validityDays: 60,
    badge: 'جديد',
  });

  const [newSub, setNewSub] = useState({
    nameAr: '',
    nameEn: '',
    stage: 'الثانوية العامة',
    baseHourlyRate: 120,
  });

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkg.name.trim()) return;
    const item: TutoringPackage = {
      id: `pkg-${Date.now()}`,
      ...newPkg,
      active: true,
      soldCount: 0,
    };
    setPackages((prev) => [item, ...prev]);
    setPkgModalOpen(false);
    setNewPkg({
      name: '',
      sessionsCount: 8,
      sessionDurationMin: 60,
      priceSar: 790,
      originalPriceSar: 960,
      validityDays: 60,
      badge: 'جديد',
    });
    appendAuditLog({
      module: 'الباقات والتسعير',
      action: 'PACKAGE_CREATED',
      severity: 'INFO',
      summary: `إضافة باقة جديدة "${item.name}" بسعر ${item.priceSar} ر.س`,
    });
    notify('تمت إضافة الباقة بنجاح');
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.nameAr.trim()) return;
    const item: SubjectItem = {
      id: `sub-${Date.now()}`,
      ...newSub,
      activeTutors: 0,
      active: true,
    };
    setSubjects((prev) => [item, ...prev]);
    setSubModalOpen(false);
    setNewSub({ nameAr: '', nameEn: '', stage: 'الثانوية العامة', baseHourlyRate: 120 });
    appendAuditLog({
      module: 'الباقات والتسعير',
      action: 'SUBJECT_CREATED',
      severity: 'INFO',
      summary: `إضافة مادة دراسية "${item.nameAr}" (${item.stage})`,
    });
    notify('تمت إضافة المادة الدراسية');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="المواد، الباقات، والتسعير الديناميكي"
        subtitle="إدارة باقات حصص التقوية، المواد والمراحل الدراسية، وقواعد التسعير الديناميكي والخصومات."
        actions={
          tab === 'packages' ? (
            <button onClick={() => setPkgModalOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> باقة جديدة
            </button>
          ) : tab === 'subjects' ? (
            <button onClick={() => setSubModalOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> مادة دراسية جديدة
            </button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="inline-flex rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
        {[
          { key: 'packages', label: 'باقات دروس التقوية', icon: Package },
          { key: 'subjects', label: 'المواد والمراحل الدراسية', icon: BookOpen },
          { key: 'rules', label: 'قواعد التسعير الديناميكي', icon: TrendingUp },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                tab === t.key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Packages Tab */}
      {tab === 'packages' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg) => {
            const discount = Math.round(
              ((pkg.originalPriceSar - pkg.priceSar) / pkg.originalPriceSar) * 100
            );
            return (
              <div
                key={pkg.id}
                className="surface-card flex flex-col justify-between p-5 transition-all hover:border-teal-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    {pkg.badge ? <Badge variant="amber">{pkg.badge}</Badge> : <span />}
                    <Switch
                      checked={pkg.active}
                      onChange={(val) => {
                        setPackages((prev) =>
                          prev.map((p) => (p.id === pkg.id ? { ...p, active: val } : p))
                        );
                        notify(val ? 'تم تفعيل الباقة' : 'تم إيقاف الباقة مؤقتاً', 'info');
                      }}
                    />
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold text-slate-900">
                    {pkg.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-extrabold text-teal-700">
                      {formatSAR(pkg.priceSar)}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      {formatSAR(pkg.originalPriceSar)}
                    </span>
                    {discount > 0 && <Badge variant="emerald">وفر {discount}%</Badge>}
                  </div>

                  <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>عدد الحصص</span>
                      <span className="font-bold text-slate-900">{pkg.sessionsCount} حصص</span>
                    </div>
                    <div className="flex justify-between">
                      <span>مدة الحصة</span>
                      <span className="font-bold text-slate-900">{pkg.sessionDurationMin} دقيقة</span>
                    </div>
                    <div className="flex justify-between">
                      <span>صلاحية الرصيد</span>
                      <span className="font-bold text-slate-900">{pkg.validityDays} يوم</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>المبيعات: {pkg.soldCount} باقة</span>
                  <span className="font-bold text-teal-700">
                    {Math.round(pkg.priceSar / pkg.sessionsCount)} ر.س / حصة
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subjects Tab */}
      {tab === 'subjects' && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">المادة الدراسية</th>
                  <th className="px-5 py-3.5">المرحلة / الصف</th>
                  <th className="px-5 py-3.5">السعر الأساسي للساعة</th>
                  <th className="px-5 py-3.5">المعلمون المعتمدون</th>
                  <th className="px-5 py-3.5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{sub.nameAr}</p>
                      <p className="text-xs text-slate-400" dir="ltr">
                        {sub.nameEn}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{sub.stage}</td>
                    <td className="px-5 py-3.5 font-bold text-teal-700">
                      {formatSAR(sub.baseHourlyRate)} / ساعة
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="sky">{sub.activeTutors} معلم</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Switch
                        checked={sub.active}
                        onChange={(val) =>
                          setSubjects((prev) =>
                            prev.map((s) => (s.id === sub.id ? { ...s, active: val } : s))
                          )
                        }
                        label={sub.active ? 'نشط' : 'موقوف'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dynamic Pricing Rules Tab */}
      {tab === 'rules' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {pricingRules.map((rule) => (
            <div key={rule.id} className="surface-card p-5">
              <div className="flex items-start justify-between">
                <Badge
                  variant={
                    rule.adjustmentType === 'PERCENT_DOWN'
                      ? 'emerald'
                      : rule.adjustmentType === 'PERCENT_UP'
                      ? 'amber'
                      : 'sky'
                  }
                >
                  {rule.adjustmentType === 'PERCENT_UP'
                    ? `+${rule.value}% زيادة ذروة`
                    : rule.adjustmentType === 'PERCENT_DOWN'
                    ? `-${rule.value}% خصم`
                    : `+${rule.value} ر.س رسوم إضافية`}
                </Badge>
                <Switch
                  checked={rule.active}
                  onChange={(val) => {
                    setPricingRules((prev) =>
                      prev.map((r) => (r.id === rule.id ? { ...r, active: val } : r))
                    );
                    notify(`تم ${val ? 'تفعيل' : 'إيقاف'} قاعدة "${rule.name}"`, 'info');
                  }}
                />
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-slate-900">{rule.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>الشرط: {rule.condition}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* New Package Modal */}
      <Modal
        open={pkgModalOpen}
        onClose={() => setPkgModalOpen(false)}
        title="إضافة باقة تقوية جديدة"
      >
        <form onSubmit={handleAddPackage} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">اسم الباقة</label>
            <input
              required
              value={newPkg.name}
              onChange={(e) => setNewPkg((s) => ({ ...s, name: e.target.value }))}
              placeholder="مثال: باقة المراجعة المكثفة (8 حصص)"
              className="input-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">عدد الحصص</label>
              <input
                type="number"
                value={newPkg.sessionsCount}
                onChange={(e) => setNewPkg((s) => ({ ...s, sessionsCount: Number(e.target.value) }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">مدة الحصة (دقيقة)</label>
              <input
                type="number"
                value={newPkg.sessionDurationMin}
                onChange={(e) =>
                  setNewPkg((s) => ({ ...s, sessionDurationMin: Number(e.target.value) }))
                }
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">السعر (ر.س)</label>
              <input
                type="number"
                value={newPkg.priceSar}
                onChange={(e) => setNewPkg((s) => ({ ...s, priceSar: Number(e.target.value) }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الصلاحية (يوم)</label>
              <input
                type="number"
                value={newPkg.validityDays}
                onChange={(e) => setNewPkg((s) => ({ ...s, validityDays: Number(e.target.value) }))}
                className="input-base"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPkgModalOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              <Sparkles className="h-4 w-4" /> حفظ الباقة
            </button>
          </div>
        </form>
      </Modal>

      {/* New Subject Modal */}
      <Modal
        open={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        title="إضافة مادة دراسية جديدة"
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الاسم بالعربية</label>
              <input
                required
                value={newSub.nameAr}
                onChange={(e) => setNewSub((s) => ({ ...s, nameAr: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الاسم بالإنجليزية</label>
              <input
                dir="ltr"
                value={newSub.nameEn}
                onChange={(e) => setNewSub((s) => ({ ...s, nameEn: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">المرحلة الدراسية</label>
              <input
                value={newSub.stage}
                onChange={(e) => setNewSub((s) => ({ ...s, stage: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">سعر الساعة الأساسي (ر.س)</label>
              <input
                type="number"
                value={newSub.baseHourlyRate}
                onChange={(e) => setNewSub((s) => ({ ...s, baseHourlyRate: Number(e.target.value) }))}
                className="input-base"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSubModalOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              إضافة المادة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
