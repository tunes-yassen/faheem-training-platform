import type { Metadata } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import './globals.css';
import { AdminProvider } from '@/context/AdminContext';
import { AdminShell } from '@/components/layout/AdminShell';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'لوحة التحكم الفائقة | منصة فهيم للتدريب',
  description:
    'مركز التحكم الشامل بدون كود لإدارة منصة فهيم للتدريب: بوابات الدفع، الفصول الافتراضية، السياسات، الصلاحيات، الدورات، دروس التقوية، والمالية.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="font-sans">
        <AdminProvider>
          <AdminShell>{children}</AdminShell>
        </AdminProvider>
      </body>
    </html>
  );
}
