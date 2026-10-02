import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { ExtensionErrorGuard } from '@/components/common/ExtensionErrorGuard';

export const metadata: Metadata = {
  title: 'Mivo Collab — Connect • Collaborate • Grow',
  description:
    'Production-grade WebRTC video meetings, real-time collaboration, instant scheduling, and enterprise security by HyperDevelopers.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
        <ExtensionErrorGuard />
        <AuthProvider>
          <Header />
          <div className="flex-1 flex w-full">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0">{children}</main>
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
