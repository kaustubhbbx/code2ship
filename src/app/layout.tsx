import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DURA - AI Executive Assistant',
  description:
    'AI-powered executive assistant that prevents you from missing deadlines, assignments, interviews, meetings, and important commitments.',
  generator: 'Next.js',
  applicationName: 'DURA',
  referrer: 'strict-origin-when-cross-origin',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0B0F14" />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-text">
        {children}
      </body>
    </html>
  );
}
