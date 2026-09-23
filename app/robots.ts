import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.dhotiaale.online';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api/admin/*',
          '/_next/*',
        ],
      },
      // Explicitly allow and guide AI Search and LLM Crawlers
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'Google-Extended',
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'Applebot',
          'Applebot-Extended',
          'CCBot',
        ],
        allow: [
          '/',
          '/support',
          '/api/content',
          '/api/winner-offers',
          '/manifest.webmanifest',
          '/llms.txt',
          '/llms-full.txt',
          '/ads.txt',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/admin/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
