import {
  NewsItem,
  PersonProfile,
  BusinessItem,
  GalleryItem,
  VideoItem,
  CommunityUpdate,
  BattleEvent,
  User,
  SiteSettings,
  ProblemReport,
} from '@/types';

export type AdminRole = 'owner' | 'superadmin' | 'admin' | 'moderator';

export interface AdminUserSession {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: AdminRole;
  isOwner: boolean;
  token: string;
}

export interface MetricCardData {
  title: string;
  value: number | string;
  change?: string;
  status: 'healthy' | 'warning' | 'error' | 'unavailable';
  iconName: string;
  description?: string;
}

export interface DashboardMetrics {
  totalUsers: number | 'Unavailable';
  activeUsers: number | 'Unavailable';
  totalNews: number | 'Unavailable';
  publishedNews: number | 'Unavailable';
  draftNews: number | 'Unavailable';
  activeBattles: number | 'Unavailable';
  completedBattles: number | 'Unavailable';
  totalVotes: number | 'Unavailable';
  totalBusinesses: number | 'Unavailable';
  galleryCount: number | 'Unavailable';
  videoCount: number | 'Unavailable';
  openReports: number | 'Unavailable';
  systemStatus: 'Optimal' | 'Degraded' | 'Offline';
}

export interface ActivityLogItem {
  id: string;
  action: string;
  entityType: 'news' | 'people' | 'business' | 'battle' | 'user' | 'gallery' | 'video' | 'setting';
  entityId?: string;
  adminEmail: string;
  timestamp: number;
  details?: string;
}

export interface StorageItem {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
  publicUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  [key: string]: any;
}
