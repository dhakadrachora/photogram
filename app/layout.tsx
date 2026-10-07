import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { PostHogProvider } from '@/components/PostHogProvider';
import { TopProgressBar } from '@/components/TopProgressBar';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#05070D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

const SITE_URL = 'https://www.dhotiaale.online';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DHOTI AALE - राजस्थान का #1 डिजिटल गाँव पोर्टल | Photo Battles, AI & Community',
    template: '%s | DHOTI AALE',
  },
  description:
    'DHOTI AALE (ढोटी आले) - राजस्थान का सबसे बड़ा डिजिटल समुदाय। लाइव फोटो बैटल (Photo Battles), DHOTI AI वॉइस असिस्टेंट, 24/7 गाँव चौपाल चैट और गाँव की ताज़ा खबरें।',
  applicationName: 'DHOTI AALE',
  manifest: '/manifest.webmanifest',
  keywords: [
    'DHOTI AALE',
    'dhoti aale',
    'dhotiaale',
    'dhoti aale online',
    'dhoti battle',
    'dhoti aale battle',
    'dhoti photo battle',
    'dhoti gaon',
    'dhoti village rajasthan',
    'dhoti aale ai',
    'dhoti choupal',
    'dhoti news',
    'dhoti ki pehchan',
    'rajasthan digital village',
    'dhoti resident blue tick',
    'photo contest rajasthan',
    'smart village dhoti',
    'dhoti aale app',
    'dhoti clan',
  ],
  authors: [{ name: 'DHOTI AALE Team', url: SITE_URL }],
  creator: 'DHOTI AALE Team',
  publisher: 'DHOTI AALE',
  category: 'Community & Entertainment',

  alternates: {
    canonical: SITE_URL,
    languages: {
      'hi-IN': SITE_URL,
      'en-IN': SITE_URL,
    },
  },

  verification: {
    google: 'google479d07a73cf8816c',
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DHOTI AALE',
  },

  icons: {
    icon: [
      {
        url: '/app-logo.png',
        sizes: '512x512',
        type: 'image/png',
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
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
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
    title: 'DHOTI AALE - राजस्थान का #1 डिजिटल गाँव पोर्टल | Photo Battles & AI',
    description:
      'राजस्थान का आधिकारिक डिजिटल समुदाय। लाइव फोटो बैटल खेलें, DHOTI AI से बात करें और गाँव चौपाल में जुड़ें।',
    url: SITE_URL,
    siteName: 'DHOTI AALE',
    locale: 'hi_IN',
    alternateLocale: ['en_IN', 'en_US'],
    type: 'website',
    images: [
      {
        url: '/app-logo.png',
        width: 1200,
        height: 1200,
        alt: 'DHOTI AALE - Rajasthan Digital Village Community & Battles',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'DHOTI AALE - राजस्थान का #1 डिजिटल गाँव पोर्टल',
    description:
      'लाइव फोटो बैटल (Photo Battles), DHOTI AI असिस्टेंट, गाँव चौपाल वर्ल्ड चैट व ताज़ा समाचार।',
    images: ['/app-logo.png'],
    creator: '@dhoti_aale',
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
};

// Comprehensive Schema.org JSON-LD Structured Data
const jsonLdGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    // 1. WebSite Schema with Sitelinks SearchBox
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'DHOTI AALE',
      alternateName: ['Dhoti Aale', 'DhotiAale', 'ढोटी आले', 'Dhoti Aale Online'],
      description: 'राजस्थान का डिजिटल गाँव समुदाय - Photo Battles, AI Assistant, चौपाल और गाँव की खबरें।',
      inLanguage: ['hi-IN', 'en-IN'],
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },

    // 2. Organization Schema
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'DHOTI AALE',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/app-logo.png`,
        width: 512,
        height: 512,
      },
      image: `${SITE_URL}/app-logo.png`,
      founder: {
        '@type': 'Organization',
        name: 'DHOTI AALE Team',
        jobTitle: 'Site Owner & Administrator',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Dhoti',
        addressRegion: 'Rajasthan',
        addressCountry: 'IN',
      },
      sameAs: [SITE_URL],
    },

    // 3. WebApplication Schema
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'DHOTI AALE Online Portal',
      url: SITE_URL,
      applicationCategory: 'SocialNetworkingApplication',
      operatingSystem: 'All (Web, Android, iOS PWA)',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      featureList: [
        'Live 1v1 Photo Battles with real-time community voting and Instagram rewards',
        'DHOTI AALE Multilingual AI Voice & Chat Companion',
        '24/7 Gaon Choupal World Chat with custom Rajasthani stickers',
        'Verified Resident Directory with Blue Tick recognition',
        'Village News Ticker, Notices, and Local Business Directory',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },

    // 4. FAQPage Schema for Google Rich Snippets & AI Search Extraction
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'DHOTI AALE (ढोटी आले) क्या है?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DHOTI AALE राजस्थान के ढोटी गाँव का आधिकारिक डिजिटल समुदाय पोर्टल है (https://www.dhotiaale.online)। यहाँ ग्रामीण निवासी और युवा लाइव फोटो बैटल (Photo Battles), DHOTI AI असिस्टेंट, गाँव चौपाल (World Chat) और ताज़ा गाँव समाचारों का लाभ उठाते हैं।',
          },
        },
        {
          '@type': 'Question',
          name: 'Dhoti Aale Photo Battle में भाग कैसे लें?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Dhoti Aale पोर्टल पर जाकर "Battle" सेक्शन चुनें, अपनी बेहतरीन तस्वीर अपलोड करें और किसी भी निवासी को 1v1 मुकाबले की चुनौती दें। गाँव के लोग लाइव वोट देकर विजेता चुनते हैं और विजेताओं को रिवॉर्ड्स दिए जाते हैं।',
          },
        },
        {
          '@type': 'Question',
          name: 'DHOTI AALE AI कैसे काम करता है?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DHOTI AALE AI एक अत्याधुनिक वॉइस और चैट असिस्टेंट है जो हिंदी, इंग्लिश और स्थानीय बोली में सवालों के जवाब देता है, गाँव की जानकारी प्रदान करता है और चौपाल में इंटरैक्ट करता है।',
          },
        },
        {
          '@type': 'Question',
          name: 'क्या DHOTI AALE मोबाइल ऐप में उपलब्ध है?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'हाँ, DHOTI AALE एक आधुनिक Progressive Web App (PWA) है जिसे आप बिना प्ले स्टोर जाए सीधे अपने स्मार्टफोन पर "Install App" बटन दबाकर सेकंडों में इंस्टॉल कर सकते हैं।',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        {/* Geo-targeting Meta tags for Rajasthan / India */}
        <meta name="geo.region" content="IN-RJ" />
        <meta name="geo.placename" content="Dhoti, Rajasthan" />
        <meta name="geo.position" content="25.5;76.0" />
        <meta name="ICBM" content="25.5, 76.0" />

        {/* AI & Search Engine Directives */}
        <meta name="rating" content="General" />
        <meta name="revisit-after" content="1 days" />
        <meta name="author" content="DHOTI AALE Team" />

        {/* Google AdSense Verification Meta */}
        <meta name="google-adsense-account" content="ca-pub-2229349785904510" />

        {/* Schema.org Structured Data */}
        <script
          id="schema-jsonld"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body suppressHydrationWarning>
        <TopProgressBar />
        <PostHogProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PostHogProvider>

        {/* Google AdSense Auto Ads - loaded safely after hydration */}
        <Script
          id="google-adsense"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2229349785904510"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}