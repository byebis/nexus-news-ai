import { create } from 'zustand';

export type ViewMode = 'magazine' | 'admin';
export type AdminTab = 'agents' | 'approval' | 'publishing' | 'activity' | 'settings';

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  category: string;
  description: string;
  status: string;
  personality: string;
  lastRun: string | null;
  createdAt: string;
  _count: { articles: number; activityLogs: number };
}

export interface PublishLog {
  id: string;
  articleId: string;
  platform: string;
  status: string;
  postId: string;
  postUrl: string;
  error: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface ApprovalLog {
  id: string;
  articleId: string;
  reviewerAction: string;
  reviewerNote: string;
  reviewedAt: string | null;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  summary: string;
  category: string;
  agentId: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  status: string;
  qualityScore: number;
  readTime: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  agent: { id: string; name: string; avatar: string; category: string };
  publishLogs: PublishLog[];
  approvalLog: ApprovalLog | null;
}

export interface ActivityLog {
  id: string;
  agentId: string;
  action: string;
  detail: string;
  status: string;
  createdAt: string;
  agent: { id: string; name: string; avatar: string; category: string };
}

export interface Settings {
  id: string;
  mode: string;
  autoCollect: boolean;
  autoEvaluate: boolean;
  autoRewrite: boolean;
  autoPublish: boolean;
  collectInterval: number;
  maxArticlesPerDay: number;
  socialPlatforms: string;
  siteName: string;
  siteTagline: string;
}

interface NexusStore {
  // View state
  viewMode: ViewMode;
  adminTab: AdminTab;
  setViewMode: (mode: ViewMode) => void;
  setAdminTab: (tab: AdminTab) => void;

  // Selected article
  selectedArticle: Article | null;
  setSelectedArticle: (article: Article | null) => void;

  // Data
  agents: Agent[];
  articles: Article[];
  pendingArticles: Article[];
  activityLogs: ActivityLog[];
  settings: Settings | null;
  selectedCategory: string;

  // Actions
  setAgents: (agents: Agent[]) => void;
  setArticles: (articles: Article[]) => void;
  setPendingArticles: (articles: Article[]) => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
  setSettings: (settings: Settings) => void;
  setSelectedCategory: (cat: string) => void;

  // Loading states
  loadingCollect: string | null;
  setLoadingCollect: (agentId: string | null) => void;
  loadingPublish: string | null;
  setLoadingPublish: (articleId: string | null) => void;
  loadingApprove: string | null;
  setLoadingApprove: (articleId: string | null) => void;

  // Toast messages
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useNexusStore = create<NexusStore>((set) => ({
  viewMode: 'magazine',
  adminTab: 'agents',
  setViewMode: (mode) => set({ viewMode: mode }),
  setAdminTab: (tab) => set({ adminTab: tab }),

  selectedArticle: null,
  setSelectedArticle: (article) => set({ selectedArticle: article }),

  agents: [],
  articles: [],
  pendingArticles: [],
  activityLogs: [],
  settings: null,
  selectedCategory: 'all',

  setAgents: (agents) => set({ agents }),
  setArticles: (articles) => set({ articles }),
  setPendingArticles: (articles) => set({ pendingArticles: articles }),
  setActivityLogs: (logs) => set({ activityLogs: logs }),
  setSettings: (settings) => set({ settings }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),

  loadingCollect: null,
  setLoadingCollect: (agentId) => set({ loadingCollect: agentId }),
  loadingPublish: null,
  setLoadingPublish: (articleId) => set({ loadingPublish: articleId }),
  loadingApprove: null,
  setLoadingApprove: (articleId) => set({ loadingApprove: articleId }),

  toastMessage: null,
  toastType: 'info',
  showToast: (message, type = 'info') => {
    set({ toastMessage: message, toastType: type });
    setTimeout(() => set({ toastMessage: null }), 4000);
  },
  clearToast: () => set({ toastMessage: null }),
}));