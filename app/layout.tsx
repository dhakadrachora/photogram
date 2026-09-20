import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#C25E29',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'DHOTI AALE - ढोटी की अपनी डिजिटल पहचान',
  description:
    "राजस्थान का डिजिटल गाँव समुदाय | Rajasthan's Digital Village Community.",
  applicationName: 'DHOTI AALE',
  manifest: '/manifest.webmanifest',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DHOTI AALE',
  },

  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },

  openGraph: {
    title: 'DHOTI AALE - ढोटी की अपनी डिजिटल पहचान',
    description:
      "राजस्थान का डिजिटल गाँव समुदाय | Rajasthan's Digital Village Community.",
    type: 'website',
    siteName: 'DHOTI AALE',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'DHOTI AALE - ढोटी की अपनी डिजिटल पहचान',
    description:
      "राजस्थान का डिजिटल गाँव समुदाय | Rajasthan's Digital Village Community.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body suppressHydrationWarning>
        {children}

        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}