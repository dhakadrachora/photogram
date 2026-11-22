import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://photogramweb.online'),
  title: 'Photogram • Photos & Visual Stories',
  description: 'A responsive visual photo-sharing web application built with Next.js, Cloudinary, and Supabase.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-black text-white antialiased selection:bg-neutral-800 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
