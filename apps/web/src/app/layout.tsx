import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AppChrome } from '@/components/AppChrome';

export const metadata: Metadata = {
  title: 'منصة فهيم للتدريب | الدورات المهنية ودروس التقوية الموثوقة',
  description:
    'منصة فهيم للتدريب — دورات مهنية معتمدة (حضوري، أونلاين مباشر، مسجل) ودروس تقوية فردية مع نخبة المعلمين المعتمدين في المملكة.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-porcelain text-slate-900 antialiased selection:bg-teal-200 selection:text-teal-900">
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
