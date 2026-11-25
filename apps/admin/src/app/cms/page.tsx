'use client';

import React, { useState } from 'react';
import {
  Plus,
  Eye,
  Edit3,
  Globe,
  FileText,
  HelpCircle,
  MessageSquareQuote,
  Search,
  LayoutTemplate,
  Navigation,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { CmsItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

const CMS_TABS: { key: CmsItem['type'] | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'all', label: 'الكل', icon: LayoutTemplate },
  { key: 'banner', label: 'البانرات الرئيسية', icon: LayoutTemplate },
  { key: 'menu', label: 'القوائم والروابط', icon: Navigation },
  { key: 'page', label: 'صفحات الموقع', icon: FileText },
  { key: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
  { key: 'testimonial', label: 'آراء العملاء', icon: MessageSquareQuote },
  { key: 'seo', label: 'إعدادات SEO', icon: Globe },
];

export default function CmsBuilderPage() {
  const { cmsItems, setCmsItems, currentAdmin, notify, appendAuditLog } = useAdmin();
  const [activeType, setActiveType] = useState<CmsItem['type'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<CmsItem | null>(null);
  const [previewItem, setPreviewItem] = useState<CmsItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formState, setFormState] = useState<{
    type: CmsItem['type'];
    title: string;
    slug: string;
    summary: string;
    content: string;
    status: CmsItem['status'];
  }>({
    type: 'page',
    title: '',
    slug: '',
    summary: '',
    content: '',
    status: 'DRAFT',
  });

  const filtered = cmsItems.filter((item) => {
    const matchType = activeType === 'all' || item.type === activeType;
    const matchSearch =
      !search.trim() ||
      item.title.includes(search) ||
      item.summary.includes(search) ||
      (item.slug || '').includes(search);
    return matchType && matchSearch;
  });

  const openCreate = () => {
    setEditingItem(null);
    setFormState({
      type: activeType === 'all' ? 'page' : activeType,
      title: '',
      slug: '',
      summary: '',
      content: '',
      status: 'DRAFT',
    });
    setIsCreateOpen(true);
  };

  const openEdit = (item: CmsItem) => {
    setEditingItem(item);
    setFormState({
      type: item.type,
      title: item.title,
      slug: item.slug || '',
      summary: item.summary,
      content: item.content,
      status: item.status,
    });
    setIsCreateOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) return;
    const today = new Date().toISOString().slice(0, 10);

    if (editingItem) {
      const updated: CmsItem = {
        ...editingItem,
        ...formState,
        updatedAt: today,
        author: currentAdmin.name,
      };
      setCmsItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      await apiRequest(`/admin/cms/${editingItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updated),
      });
      appendAuditLog({
        module: 'إدارة المحتوى (CMS)',
        action: 'CMS_UPDATED',
        severity: 'INFO',
        summary: `تعديل محتوى "${updated.title}" (الحالة: ${updated.status})`,
      });
      notify('تم تحديث المحتوى بنجاح');
    } else {
      const created: CmsItem = {
        id: `cms-${Date.now()}`,
        ...formState,
        updatedAt: today,
        author: currentAdmin.name,
      };
      setCmsItems((prev) => [created, ...prev]);
      await apiRequest('/admin/cms', {
        method: 'POST',
        body: JSON.stringify(created),
      });
      appendAuditLog({
        module: 'إدارة المحتوى (CMS)',
        action: 'CMS_CREATED',
        severity: 'INFO',
        summary: `إنشاء عنصر محتوى جديد "${created.title}"`,
      });
      notify('تم إنشاء العنصر بنجاح');
    }
    setIsCreateOpen(false);
  };

  const updateStatus = (item: CmsItem, status: CmsItem['status']) => {
    setCmsItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)));
    appendAuditLog({
      module: 'إدارة المحتوى (CMS)',
      action: `CMS_${status}`,
      severity: 'INFO',
      summary: `تغيير حالة "${item.title}" إلى ${status}`,
    });
    notify(`تم تحويل الحالة إلى ${status === 'PUBLISHED' ? 'منشور' : status === 'PREVIEW' ? 'معاينة' : 'مسودة'}`);
  };

  const handleDelete = (item: CmsItem) => {
    setCmsItems((prev) => prev.filter((i) => i.id !== item.id));
    appendAuditLog({
      module: 'إدارة المحتوى (CMS)',
      action: 'CMS_DELETED',
      severity: 'WARNING',
      summary: `حذف عنصر المحتوى "${item.title}"`,
    });
    notify('تم حذف العنصر', 'warning');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المحتوى وبناء الموقع (Dynamic CMS)"
        subtitle="إدارة القوائم، البانرات الرئيسية، الصفحات التسويقية، الأسئلة الشائعة، آراء العملاء المعتمدة، وإعدادات SEO مع مسار مسودة / معاينة / نشر."
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            <span>إضافة محتوى جديد</span>
          </button>
        }
      />

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
          {CMS_TABS.map((t) => {
            const Icon = t.icon;
            const active = activeType === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveType(t.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all',
                  active ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالعنوان أو الرابط..."
            className="input-base pr-9 text-xs"
          />
        </div>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="surface-card flex flex-col justify-between p-5 transition-all hover:border-teal-200"
          >
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <Badge variant="sky">
                  {CMS_TABS.find((t) => t.key === item.type)?.label || item.type}
                </Badge>
                <Badge
                  variant={
                    item.status === 'PUBLISHED'
                      ? 'emerald'
                      : item.status === 'PREVIEW'
                      ? 'amber'
                      : 'slate'
                  }
                >
                  {item.status === 'PUBLISHED'
                    ? 'منشور'
                    : item.status === 'PREVIEW'
                    ? 'قيد المعاينة'
                    : 'مسودة'}
                </Badge>
              </div>
              <h3 className="font-display text-base font-bold text-slate-900">{item.title}</h3>
              {item.slug && (
                <p className="mt-1 font-mono text-[11px] text-teal-700" dir="ltr">
                  {item.slug}
                </p>
              )}
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {item.summary}
              </p>
            </div>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>بواسطة {item.author}</span>
                <span dir="ltr">{item.updatedAt}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPreviewItem(item)}
                  className="btn-secondary flex-1 py-1.5 text-xs"
                >
                  <Eye className="h-3.5 w-3.5" /> معاينة
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="btn-secondary flex-1 py-1.5 text-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" /> تعديل
                </button>
                {item.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => updateStatus(item, 'PUBLISHED')}
                    className="btn-primary py-1.5 text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> نشر
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item)}
                  className="rounded-xl border border-rose-200 p-1.5 text-rose-500 hover:bg-rose-50"
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={editingItem ? 'تعديل عنصر المحتوى' : 'إنشاء عنصر محتوى جديد'}
        subtitle="يمكنك الحفظ كمسودة أو نشره فوراً على واجهة الموقع."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">نوع المحتوى</label>
              <select
                value={formState.type}
                onChange={(e) => setFormState((s) => ({ ...s, type: e.target.value as CmsItem['type'] }))}
                className="input-base"
              >
                <option value="banner">بانر رئيسي</option>
                <option value="menu">قائمة تنقل</option>
                <option value="page">صفحة تسويقية</option>
                <option value="faq">سؤال شائع</option>
                <option value="testimonial">رأي عميل</option>
                <option value="seo">إعداد SEO</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">حالة النشر</label>
              <select
                value={formState.status}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, status: e.target.value as CmsItem['status'] }))
                }
                className="input-base"
              >
                <option value="DRAFT">مسودة (Draft)</option>
                <option value="PREVIEW">معاينة (Preview)</option>
                <option value="PUBLISHED">منشور (Published)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">العنوان</label>
            <input
              required
              value={formState.title}
              onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
              placeholder="مثال: بانر عروض الفصل الدراسي الثاني"
              className="input-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">المعرّف / الرابط (Slug)</label>
            <input
              dir="ltr"
              value={formState.slug}
              onChange={(e) => setFormState((s) => ({ ...s, slug: e.target.value }))}
              placeholder="/offers/term-2"
              className="input-base font-mono text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">الملخص / الوصف المختصر (Meta Description)</label>
            <input
              value={formState.summary}
              onChange={(e) => setFormState((s) => ({ ...s, summary: e.target.value }))}
              className="input-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">المحتوى الكامل</label>
            <textarea
              rows={4}
              value={formState.content}
              onChange={(e) => setFormState((s) => ({ ...s, content: e.target.value }))}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              حفظ التغييرات
            </button>
          </div>
        </form>
      </Modal>

      {/* Live Preview Modal */}
      <Modal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title="معاينة فورية للمحتوى"
        subtitle={previewItem?.slug || undefined}
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-sky-50 p-6">
              <Badge variant="teal" className="mb-3">
                {CMS_TABS.find((t) => t.key === previewItem.type)?.label}
              </Badge>
              <h3 className="font-display text-xl font-extrabold text-slate-900">
                {previewItem.title}
              </h3>
              <p className="mt-2 text-sm font-semibold text-teal-800">{previewItem.summary}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {previewItem.content}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              {previewItem.status !== 'PUBLISHED' && (
                <button
                  onClick={() => {
                    updateStatus(previewItem, 'PUBLISHED');
                    setPreviewItem(null);
                  }}
                  className="btn-primary"
                >
                  اعتماد ونشر الآن
                </button>
              )}
              <button onClick={() => setPreviewItem(null)} className="btn-secondary">
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
