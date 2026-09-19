import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequestAsync } from '@/lib/admin-auth';
import { contentStore } from '@/lib/content-store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Returns all items of a given type for Admin (includes unpublished drafts)
export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin privileges required. Only verified admin has access.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'overview';

  if (type === 'overview') {
    return NextResponse.json({
      stats: {
        totalNews: contentStore.news.size,
        totalPeople: contentStore.people.size,
        totalBusiness: contentStore.business.size,
        totalGallery: contentStore.gallery.size,
        totalVideos: contentStore.videos.size,
        totalUpdates: contentStore.updates.size,
        totalBattles: contentStore.battles.size,
        totalChatMessages: contentStore.chatMessages.length,
      },
      settings: contentStore.settings,
    });
  }

  if (type === 'news') {
    return NextResponse.json({ items: Array.from(contentStore.news.values()).reverse() });
  }
  if (type === 'people') {
    return NextResponse.json({ items: Array.from(contentStore.people.values()).reverse() });
  }
  if (type === 'business') {
    return NextResponse.json({ items: Array.from(contentStore.business.values()).reverse() });
  }
  if (type === 'gallery') {
    return NextResponse.json({ items: Array.from(contentStore.gallery.values()).reverse() });
  }
  if (type === 'videos') {
    return NextResponse.json({ items: Array.from(contentStore.videos.values()).reverse() });
  }
  if (type === 'updates') {
    return NextResponse.json({ items: Array.from(contentStore.updates.values()).reverse() });
  }
  if (type === 'settings') {
    return NextResponse.json({ settings: contentStore.settings });
  }
  if (type === 'chat') {
    return NextResponse.json({ messages: contentStore.chatMessages });
  }
  if (type === 'users') {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, phone, avatar, badge, rank, role, is_admin, coins, wins, created_at')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return NextResponse.json({ items: data });
        }
      } catch (err) {
        console.warn('Failed to load registered users from Supabase:', err);
      }
    }
    return NextResponse.json({ items: [] });
  }

  return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
}

// POST: Admin creates a new item (News, People, Business, Gallery, Videos, Updates)
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin privileges required.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { type, item } = body;

    if (!type || !item) {
      return NextResponse.json({ error: 'Missing type or item payload' }, { status: 400 });
    }

    const id = item.id || `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = item.createdAt || Date.now();

    if (type === 'news') {
      const newItem = {
        id,
        title: item.title || 'Untitled News',
        category: item.category || 'General',
        excerpt: item.excerpt || '',
        content: item.content || '',
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800',
        author: item.author || 'Admin',
        published: item.published ?? true,
        createdAt,
        views: 0,
      };
      contentStore.news.set(id, newItem);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('news').insert({
            id,
            title: newItem.title,
            category: newItem.category,
            excerpt: newItem.excerpt,
            content: newItem.content,
            image_url: newItem.imageUrl,
            author: newItem.author,
            published: newItem.published,
            created_at: new Date(createdAt).toISOString(),
            views: 0,
          });
        } catch (e) {
          console.warn('Failed to insert news into Supabase:', e);
        }
      }

      return NextResponse.json({ success: true, item: newItem });
    }

    if (type === 'people') {
      const newItem = {
        id,
        name: item.name || 'Anonymous',
        designation: item.designation || 'Community Member',
        bio: item.bio || '',
        photoUrl: item.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
        achievements: item.achievements || '',
        category: item.category || 'Resident',
        published: item.published ?? true,
        createdAt,
      };
      contentStore.people.set(id, newItem);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('people').insert({
            id,
            name: newItem.name,
            designation: newItem.designation,
            bio: newItem.bio,
            photo_url: newItem.photoUrl,
            achievements: newItem.achievements,
            category: newItem.category,
            published: newItem.published,
            created_at: new Date(createdAt).toISOString(),
          });
        } catch (e) {
          console.warn('Failed to insert people into Supabase:', e);
        }
      }

      return NextResponse.json({ success: true, item: newItem });
    }

    if (type === 'business') {
      const newItem = {
        id,
        name: item.name || 'Local Enterprise',
        category: item.category || 'General',
        phone: item.phone || '',
        address: item.address || '',
        description: item.description || '',
        logoUrl: item.logoUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=500',
        verified: item.verified ?? true,
        published: item.published ?? true,
        createdAt,
      };
      contentStore.business.set(id, newItem);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('business').insert({
            id,
            name: newItem.name,
            category: newItem.category,
            phone: newItem.phone,
            address: newItem.address,
            description: newItem.description,
            logo_url: newItem.logoUrl,
            verified: newItem.verified,
            published: newItem.published,
            created_at: new Date(createdAt).toISOString(),
          });
        } catch (e) {
          console.warn('Failed to insert business into Supabase:', e);
        }
      }

      return NextResponse.json({ success: true, item: newItem });
    }

    if (type === 'gallery') {
      const newItem = {
        id,
        title: item.title || 'Community Snapshot',
        category: item.category || 'Village Life',
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        caption: item.caption || '',
        published: item.published ?? true,
        createdAt,
      };
      contentStore.gallery.set(id, newItem);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('gallery').insert({
            id,
            title: newItem.title,
            category: newItem.category,
            image_url: newItem.imageUrl,
            caption: newItem.caption,
            published: newItem.published,
            created_at: new Date(createdAt).toISOString(),
          });
        } catch (e) {
          console.warn('Failed to insert gallery into Supabase:', e);
        }
      }

      return NextResponse.json({ success: true, item: newItem });
    }

    if (type === 'videos') {
      const newItem = {
        id,
        title: item.title || 'Community Video',
        category: item.category || 'Culture',
        videoUrl: item.videoUrl || '',
        thumbnailUrl: item.thumbnailUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
        description: item.description || '',
        published: item.published ?? true,
        createdAt,
        views: 0,
      };
      contentStore.videos.set(id, newItem);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('videos').insert({
            id,
            title: newItem.title,
            category: newItem.category,
            video_url: newItem.videoUrl,
            thumbnail_url: newItem.thumbnailUrl,
            description: newItem.description,
            published: newItem.published,
            created_at: new Date(createdAt).toISOString(),
            views: 0,
          });
        } catch (e) {
          console.warn('Failed to insert video into Supabase:', e);
        }
      }

      return NextResponse.json({ success: true, item: newItem });
    }

    if (type === 'updates') {
      const newItem = {
        id,
        title: item.title || 'Community Announcement',
        summary: item.summary || '',
        tag: item.tag || 'Announcement',
        badgeColor: item.badgeColor || 'amber',
        published: item.published ?? true,
        date: item.date || 'Just now',
        linkUrl: item.linkUrl || '',
        createdAt,
      };
      contentStore.updates.set(id, newItem);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('updates').insert({
            id,
            title: newItem.title,
            summary: newItem.summary,
            tag: newItem.tag,
            badge_color: newItem.badgeColor,
            published: newItem.published,
            date: newItem.date,
            link_url: newItem.linkUrl,
            created_at: new Date(createdAt).toISOString(),
          });
        } catch (e) {
          console.warn('Failed to insert update into Supabase:', e);
        }
      }

      return NextResponse.json({ success: true, item: newItem });
    }

    return NextResponse.json({ error: 'Unknown content type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

// PUT: Admin edits or updates status/publish of an item or settings
export async function PUT(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin privileges required.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { type, id, updates, settings } = body;

    if (type === 'settings' && settings) {
      contentStore.settings = { ...contentStore.settings, ...settings };
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('site_settings').upsert({
            id: 'default',
            site_title: contentStore.settings.siteTitle,
            site_tagline: contentStore.settings.siteTagline,
            announcement_banner: contentStore.settings.announcementBanner,
            is_announcement_active: contentStore.settings.isAnnouncementActive,
            allow_world_chat: contentStore.settings.allowWorldChat,
            allow_guest_ai: contentStore.settings.allowGuestAi,
            hero_badge: contentStore.settings.heroBadge,
            contact_email: contentStore.settings.contactEmail,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Failed to update site settings in Supabase:', e);
        }
      }
      return NextResponse.json({ success: true, settings: contentStore.settings });
    }

    if (!type || !id || !updates) {
      return NextResponse.json({ error: 'Missing type, id, or updates payload' }, { status: 400 });
    }

    if (type === 'news') {
      const existing = contentStore.news.get(id);
      if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      const updated = { ...existing, ...updates };
      contentStore.news.set(id, updated);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('news').update({
            title: updated.title,
            category: updated.category,
            excerpt: updated.excerpt,
            content: updated.content,
            image_url: updated.imageUrl,
            author: updated.author,
            published: updated.published,
          }).eq('id', id);
        } catch (e) {
          console.warn('Failed to update news in Supabase:', e);
        }
      }
      return NextResponse.json({ success: true, item: updated });
    }

    if (type === 'people') {
      const existing = contentStore.people.get(id);
      if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      const updated = { ...existing, ...updates };
      contentStore.people.set(id, updated);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('people').update({
            name: updated.name,
            designation: updated.designation,
            bio: updated.bio,
            photo_url: updated.photoUrl,
            achievements: updated.achievements,
            category: updated.category,
            published: updated.published,
          }).eq('id', id);
        } catch (e) {
          console.warn('Failed to update people in Supabase:', e);
        }
      }
      return NextResponse.json({ success: true, item: updated });
    }

    if (type === 'business') {
      const existing = contentStore.business.get(id);
      if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      const updated = { ...existing, ...updates };
      contentStore.business.set(id, updated);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('business').update({
            name: updated.name,
            category: updated.category,
            phone: updated.phone,
            address: updated.address,
            description: updated.description,
            logo_url: updated.logoUrl,
            verified: updated.verified,
            published: updated.published,
          }).eq('id', id);
        } catch (e) {
          console.warn('Failed to update business in Supabase:', e);
        }
      }
      return NextResponse.json({ success: true, item: updated });
    }

    if (type === 'gallery') {
      const existing = contentStore.gallery.get(id);
      if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      const updated = { ...existing, ...updates };
      contentStore.gallery.set(id, updated);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('gallery').update({
            title: updated.title,
            category: updated.category,
            image_url: updated.imageUrl,
            caption: updated.caption,
            published: updated.published,
          }).eq('id', id);
        } catch (e) {
          console.warn('Failed to update gallery in Supabase:', e);
        }
      }
      return NextResponse.json({ success: true, item: updated });
    }

    if (type === 'videos') {
      const existing = contentStore.videos.get(id);
      if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      const updated = { ...existing, ...updates };
      contentStore.videos.set(id, updated);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('videos').update({
            title: updated.title,
            category: updated.category,
            video_url: updated.videoUrl,
            thumbnail_url: updated.thumbnailUrl,
            description: updated.description,
            published: updated.published,
          }).eq('id', id);
        } catch (e) {
          console.warn('Failed to update videos in Supabase:', e);
        }
      }
      return NextResponse.json({ success: true, item: updated });
    }

    if (type === 'updates') {
      const existing = contentStore.updates.get(id);
      if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      const updated = { ...existing, ...updates };
      contentStore.updates.set(id, updated);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('updates').update({
            title: updated.title,
            summary: updated.summary,
            tag: updated.tag,
            badge_color: updated.badgeColor,
            published: updated.published,
            date: updated.date,
            link_url: updated.linkUrl,
          }).eq('id', id);
        } catch (e) {
          console.warn('Failed to update updates in Supabase:', e);
        }
      }
      return NextResponse.json({ success: true, item: updated });
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Admin deletes an item
export async function DELETE(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin privileges required.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
  }

  let deleted = false;
  if (type === 'news') {
    deleted = contentStore.news.delete(id);
    if (isSupabaseConfigured()) {
      try { await supabase.from('news').delete().eq('id', id); } catch (e) {}
    }
  } else if (type === 'people') {
    deleted = contentStore.people.delete(id);
    if (isSupabaseConfigured()) {
      try { await supabase.from('people').delete().eq('id', id); } catch (e) {}
    }
  } else if (type === 'business') {
    deleted = contentStore.business.delete(id);
    if (isSupabaseConfigured()) {
      try { await supabase.from('business').delete().eq('id', id); } catch (e) {}
    }
  } else if (type === 'gallery') {
    deleted = contentStore.gallery.delete(id);
    if (isSupabaseConfigured()) {
      try { await supabase.from('gallery').delete().eq('id', id); } catch (e) {}
    }
  } else if (type === 'videos') {
    deleted = contentStore.videos.delete(id);
    if (isSupabaseConfigured()) {
      try { await supabase.from('videos').delete().eq('id', id); } catch (e) {}
    }
  } else if (type === 'updates') {
    deleted = contentStore.updates.delete(id);
    if (isSupabaseConfigured()) {
      try { await supabase.from('updates').delete().eq('id', id); } catch (e) {}
    }
  } else if (type === 'chat') {
    const prevLen = contentStore.chatMessages.length;
    contentStore.chatMessages = contentStore.chatMessages.filter((m) => m.id !== id);
    deleted = contentStore.chatMessages.length < prevLen;
    if (isSupabaseConfigured()) {
      try { await supabase.from('chat_messages').delete().eq('id', id); } catch (e) {}
    }
  }

  return NextResponse.json({ success: deleted, deletedId: id });
}
