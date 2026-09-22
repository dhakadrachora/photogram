import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'DHOTI AALE - ढोटी की अपनी डिजिटल पहचान',
    short_name: 'DHOTI AALE',
    description:
      "राजस्थान का डिजिटल गाँव समुदाय | Rajasthan's Digital Village Community.",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBF9F5',
    theme_color: '#C25E29',
    lang: 'hi',
    dir: 'ltr',
    categories: ['social', 'community', 'news'],
    icons: [
      {
        src: '/app-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}