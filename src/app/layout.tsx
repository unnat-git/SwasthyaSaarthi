import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import GlobalLanguageHeader from '../components/GlobalLanguageHeader';
import OfflineSyncBanner from '../components/OfflineSyncBanner';

export const metadata: Metadata = {
  title: 'Swastya Saarthi — Rural Health AI Platform',
  description: 'AI-powered early disease risk prediction platform for rural healthcare workers',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#00685f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          {children}
          <OfflineSyncBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
