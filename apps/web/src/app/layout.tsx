import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: { default: 'Gujarati Global', template: '%s · Gujarati Global' },
  description: 'The global community platform connecting the Gujarati diaspora — events, groups, resources, and connections across the world.',
  keywords: ['gujarati', 'diaspora', 'community', 'events', 'groups'],
  authors: [{ name: 'Gujarati Global' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://gujaratiglobal.com',
    siteName: 'Gujarati Global',
    title: 'Gujarati Global — Connect with Your Community',
    description: 'Discover events, join groups, and connect with Gujaratis worldwide.',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF9B2B',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
