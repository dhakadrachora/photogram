import { NewsItem } from '@/types';

export interface LiveMarketData {
  weather: {
    temp: number;
    windspeed: number;
    city: string;
  } | null;
  crypto: {
    btc: number;
    eth: number;
    sol: number;
  } | null;
}

export async function fetchLivePublicNews(): Promise<NewsItem[]> {
  const liveItems: NewsItem[] = [];

  const feeds = [
    {
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss?hl=hi%26gl=IN%26ceid=IN:hi',
      category: 'Technology',
      tag: 'Hindi News'
    },
    {
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
      category: 'World',
      tag: 'National Top Stories'
    }
  ];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, { next: { revalidate: 300 } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        data.items.slice(0, 10).forEach((item: any, idx: number) => {
          const cleanDesc = (item.description || item.content || '')
            .replace(/<[^>]*>?/gm, '')
            .slice(0, 350);
          
          liveItems.push({
            id: `live-feed-${item.guid || item.link || Math.random().toString(36).substring(7)}`,
            title: item.title || 'ताज़ा समाचार अपडेट',
            excerpt: cleanDesc || item.title || 'ताज़ा समाचार अपडेट',
            content: `${cleanDesc}\n\nपूरी खबर पढ़ने के लिए मूल स्रोत देखें: ${item.link || '#'}`,
            category: (feed.category as any) || 'World',
            imageUrl: item.thumbnail || item.enclosure?.link || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
            author: item.author || 'Dhotiaale Live AI Desk',
            published: true,
            createdAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
            views: Math.floor(Math.random() * 800) + 250
          });
        });
      }
    } catch (err) {
      console.warn('Failed to fetch feed:', feed.url, err);
    }
  }

  return liveItems;
}

export async function fetchLiveMarketData(): Promise<LiveMarketData> {
  let weather = null;
  let crypto = null;

  try {
    const wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.18&longitude=75.83&current_weather=true', { next: { revalidate: 600 } });
    if (wRes.ok) {
      const wData = await wRes.json();
      weather = {
        temp: wData.current_weather?.temperature || 32,
        windspeed: wData.current_weather?.windspeed || 5,
        city: 'Kota / Rajasthan'
      };
    }
  } catch (e) {
    console.warn('Weather fetch failed', e);
  }

  try {
    const cRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=inr', { next: { revalidate: 300 } });
    if (cRes.ok) {
      const cData = await cRes.json();
      crypto = {
        btc: cData.bitcoin?.inr || 8250000,
        eth: cData.ethereum?.inr || 260000,
        sol: cData.solana?.inr || 11500
      };
    }
  } catch (e) {
    console.warn('Crypto fetch failed', e);
  }

  return { weather, crypto };
}
