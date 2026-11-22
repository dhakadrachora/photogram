import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/direct/*', '/api/*'],
      },
    ],
    sitemap: 'https://photogramweb.online/sitemap.xml',
  };
}
