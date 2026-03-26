import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F59E0B',
};

export const metadata: Metadata = {
  title: 'Gujarati Connect — Find Gujaratis Nearby',
  description: 'Connect with Gujarati people around the world. Find nearby Gujaratis when traveling or living abroad.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Gujarati Connect' },
  openGraph: {
    title: 'Gujarati Connect',
    description: 'Find Gujaratis near you, anywhere in the world.',
    type: 'website',
  },
};

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <div className="app-container">
            <Header />
            <main className="scroll-area">
              {children}
            </main>
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
