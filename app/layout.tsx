import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://photogramweb.online'),
  title: {
    default: 'Photogram • Photos, Visual Stories & Fast Direct Chat',
    template: '%s | Photogram',
  },
  description:
    'Experience Photogram – A modern, lightweight visual social media web app. Share HD photos, 24-hour visual stories, explore trending creators, and chat with friends in real-time.',
  applicationName: 'Photogram',
  authors: [{ name: 'Photogram Team', url: 'https://photogramweb.online' }],
  generator: 'Next.js',
  keywords: [
    'Photogram',
    'photogramweb.online',
    'social media app',
    'photo sharing web app',
    'visual stories',
    'reels',
    'direct chat',
    'instagram alternative',
    'free photo sharing',
    'web social network',
  ],
  creator: 'Photogram',
  publisher: 'Photogram',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://photogramweb.online',
  },
  openGraph: {
    title: 'Photogram • Capture, Share & Connect',
    description:
      'Fast, modern, visual social web app. Share your moments with photo posts, 24h stories, and real-time private messages.',
    url: 'https://photogramweb.online',
    siteName: 'Photogram',
    images: [
      {
        url: '/app-logo.png',
        width: 1200,
        height: 630,
        alt: 'Photogram Social Media App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Photogram • Photos & Visual Stories',
    description:
      'Fast, modern visual photo-sharing web app. Connect with friends and explore creative community photos on Photogram.',
    images: ['/app-logo.png'],
    creator: '@photogram',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  verification: {
    google: 'google479d07a73cf8816c',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Photogram',
  url: 'https://photogramweb.online',
  description:
    'A fast, responsive visual social media web application. Share HD photos, multi-image carousels, 24h stories, and chat instantly with friends.',
  applicationCategory: 'SocialNetworkingApplication',
  operatingSystem: 'All (Web, Android, iOS, Windows, macOS)',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Organization',
    name: 'Photogram',
    url: 'https://photogramweb.online',
    logo: 'https://photogramweb.online/app-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-black text-white antialiased selection:bg-neutral-800 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
