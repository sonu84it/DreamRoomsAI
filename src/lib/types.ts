export interface Video {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  style: string;
  lighting: string;
  cameraMotion: string;
  selectedItems: string[];
  duration: number; // in seconds
  createdAt: string; // ISO string
  viewCount: number;
  likeCount: number;
  saveCount: number;
  trendScore: number;
}

export interface GenerationJob {
  id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  category: string;
  style: string;
  prompt: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  meta?: any;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalLikes: number;
  totalSaves: number;
  totalGeneratedVideos: number;
  averageWatchTime: number; // mock metric
  retentionRate: number; // mock percentage
  ctrToDetail: number; // mock percentage
  topCategory: { name: string; count: number };
  topStyle: { name: string; count: number };
  dailyViews: { date: string; count: number }[];
  categoryViews: { category: string; count: number }[];
  styleViews: { style: string; count: number }[];
}

export interface SystemConfig {
  siteName: string;
  generationInterval: number; // in minutes
  homeVideosLimit: number;
  useMockData: boolean;
  heroVideoId: string | null;
  gcpProjectId: string;
  gcpLocation: string;
  vertexModel: string;
}

