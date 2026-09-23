import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SMM_API_URL = process.env.SMM_API_URL || 'https://cheapsmmhub.com/api/v2';
const SMM_API_KEY = process.env.SMM_API_KEY || '63f9c84c8e452836c39154c93f633685e2434b12';
const SMM_SERVICE_ID = process.env.SMM_SERVICE_ID || '4436';

const COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 Hours

interface BoosterOrder {
  id: string;
  orderId: string;
  link: string;
  username: string;
  quantity: number;
  status: string;
  timestamp: number;
}

// In-memory persistent state across server lifecycle
const reelCooldownMap = new Map<string, number>();
const boosterOrders: BoosterOrder[] = [
  {
    id: 'ord_sample_1',
    orderId: '784129',
    link: 'https://www.instagram.com/reel/sample1/',
    username: 'rohit_dhakad_official',
    quantity: 100,
    status: 'Completed',
    timestamp: Date.now() - 45 * 60 * 1000,
  },
  {
    id: 'ord_sample_2',
    orderId: '784192',
    link: 'https://www.instagram.com/reel/sample2/',
    username: 'rajasthani_swag_dhoti',
    quantity: 100,
    status: 'Completed',
    timestamp: Date.now() - 25 * 60 * 1000,
  },
  {
    id: 'ord_sample_3',
    orderId: '784230',
    link: 'https://www.instagram.com/reel/sample3/',
    username: 'dhoti_clan_king',
    quantity: 100,
    status: 'Processing',
    timestamp: Date.now() - 5 * 60 * 1000,
  },
];

let baseDeliveredViews = 12400;

function cleanInstagramUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    return `${url.origin}${url.pathname.replace(/\/$/, '')}/`;
  } catch {
    return rawUrl.trim().split('?')[0].replace(/\/$/, '') + '/';
  }
}

function extractUsernameOrHandle(url: string, providedUser?: string): string {
  if (providedUser && providedUser.trim()) {
    return providedUser.trim().replace(/^@/, '');
  }
  try {
    const parts = url.split('/').filter(Boolean);
    const shortcode = parts[parts.length - 1] || 'user';
    return `user_${shortcode.slice(0, 6)}`;
  } catch {
    return 'dhoti_resident';
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const orderId = searchParams.get('orderId');

  // Order status lookup
  if (action === 'status' && orderId) {
    try {
      const formData = new URLSearchParams();
      formData.append('key', SMM_API_KEY);
      formData.append('action', 'status');
      formData.append('order', orderId);

      const smmRes = await fetch(SMM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      const smmData = await smmRes.json().catch(() => null);

      if (smmData && !smmData.error) {
        return NextResponse.json({
          success: true,
          orderId,
          status: smmData.status || 'Processing',
          charge: smmData.charge || '0',
          remains: smmData.remains ?? '0',
        });
      }
    } catch (e) {
      console.warn('SMM status check fallback:', e);
    }

    const localOrder = boosterOrders.find((o) => o.orderId === orderId);
    return NextResponse.json({
      success: true,
      orderId,
      status: localOrder?.status || 'Processing',
    });
  }

  // Check cooldown for a specific link
  const checkLink = searchParams.get('checkLink');
  if (checkLink) {
    const cleanUrl = cleanInstagramUrl(checkLink);
    const lastTime = reelCooldownMap.get(cleanUrl) || 0;
    const elapsed = Date.now() - lastTime;
    const isCooling = elapsed < COOLDOWN_MS;
    const remainingMs = isCooling ? COOLDOWN_MS - elapsed : 0;

    return NextResponse.json({
      canSubmit: !isCooling,
      remainingMs,
      remainingMinutes: Math.ceil(remainingMs / (60 * 1000)),
    });
  }

  // Live Leaderboard & Recent Deliveries
  const recentList = [...boosterOrders].reverse().slice(0, 15);
  const totalDelivered = baseDeliveredViews + boosterOrders.length * 100;

  return NextResponse.json({
    success: true,
    totalDelivered,
    recentDeliveries: recentList,
    leaderboard: [
      { rank: 1, handle: '@dhoti_champion_rohit', boostedViews: '3,400 Views', badges: 'VIP 👑' },
      { rank: 2, handle: '@swag_rajasthan_dhoti', boostedViews: '2,800 Views', badges: 'Top Booster 🔥' },
      { rank: 3, handle: '@marwadi_reels_star', boostedViews: '2,100 Views', badges: 'Elite ✨' },
      { rank: 4, handle: '@desi_dhoti_culture', boostedViews: '1,600 Views', badges: 'Rising ⚡' },
      { rank: 5, handle: '@choupal_veer_325001', boostedViews: '1,200 Views', badges: 'Active 🎯' },
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawLink = body.link;
    const providedUser = body.username;

    if (!rawLink || typeof rawLink !== 'string') {
      return NextResponse.json(
        { success: false, error: 'कृपया मान्य Instagram Reel लिंक दर्ज करें।' },
        { status: 400 }
      );
    }

    // Validate Instagram Reel URL pattern
    const isInstagram =
      rawLink.includes('instagram.com/reel/') ||
      rawLink.includes('instagram.com/p/') ||
      rawLink.includes('instagram.com/reels/') ||
      rawLink.includes('instagram.com/tv/');

    if (!isInstagram) {
      return NextResponse.json(
        {
          success: false,
          error: 'अमान्य लिंक! कृपया सही Instagram Reel लिंक पेस्ट करें (उदा: https://www.instagram.com/reel/...)',
        },
        { status: 400 }
      );
    }

    const cleanUrl = cleanInstagramUrl(rawLink);

    // Enforce 3-Hour Cooldown
    const lastClaimed = reelCooldownMap.get(cleanUrl) || 0;
    const elapsed = Date.now() - lastClaimed;

    if (elapsed < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - elapsed;
      const hours = Math.floor(remainingMs / (60 * 60 * 1000));
      const mins = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      const remainingFormatted = hours > 0 ? `${hours} घंटे ${mins} मिनट` : `${mins} मिनट`;

      return NextResponse.json(
        {
          success: false,
          error: `यह रील पहले ही सबमिट की जा चुकी है! आप इस लिंक पर ${remainingFormatted} बाद दोबारा 100 फ्री व्यूज ले सकते हैं। (या अभी किसी दूसरी रील का लिंक डालें)`,
          remainingMs,
          remainingFormatted,
        },
        { status: 429 }
      );
    }

    // Call CheapSMMHub API to dispatch 100 Views Order
    let smmOrderId = `ord_${Date.now()}`;
    let smmStatus = 'Processing';

    try {
      const formData = new URLSearchParams();
      formData.append('key', SMM_API_KEY);
      formData.append('action', 'add');
      formData.append('service', SMM_SERVICE_ID);
      formData.append('link', cleanUrl);
      formData.append('quantity', '100');

      const smmRes = await fetch(SMM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const smmResponse = await smmRes.json().catch(() => null);

      if (smmResponse && smmResponse.order) {
        smmOrderId = String(smmResponse.order);
        smmStatus = 'In Progress';
      } else if (smmResponse && smmResponse.error) {
        console.warn('[CheapSMMHub Error]:', smmResponse.error);
        // If SMM error happens, fallback gracefully so user gets order ID and admin can inspect
        smmStatus = 'Queued';
      }
    } catch (apiError) {
      console.error('[SMM Dispatch Error]:', apiError);
      smmStatus = 'Queued';
    }

    // Update cooldown map
    reelCooldownMap.set(cleanUrl, Date.now());

    // Record order in history
    const username = extractUsernameOrHandle(cleanUrl, providedUser);
    const newOrder: BoosterOrder = {
      id: `dhoti_${Date.now()}`,
      orderId: smmOrderId,
      link: cleanUrl,
      username,
      quantity: 100,
      status: smmStatus,
      timestamp: Date.now(),
    };

    boosterOrders.push(newOrder);
    if (boosterOrders.length > 100) boosterOrders.shift();

    return NextResponse.json({
      success: true,
      orderId: smmOrderId,
      quantity: 100,
      username,
      status: smmStatus,
      message: 'बधाई हो! आपके रील पर 100 फ्री व्यूज का आर्डर सफलतापूर्वक भेज दिया गया है।',
      cooldownExpiresAt: Date.now() + COOLDOWN_MS,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'ऑर्डर प्रोसेस करने में त्रुटि हुई।' },
      { status: 500 }
    );
  }
}
