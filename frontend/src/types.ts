export interface Bookmark {
  id: string;
  title: string;
  url: string;
  summary: string;
  intent: string;
  tags: string[];
  addedAt: string;
  status: "REVIVED" | "ARCHIVED" | "PROCESSING";
  domain: string;
  readingTime?: string;
  isRead: boolean;
  confidence?: number;
}

export interface BillingHistory {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "PAID" | "PENDING" | "FAILED";
}

export interface AnalyticsData {
  growth: number;
  density: number;
  revivalRate: number;
  tagsCount: Record<string, number>;
  peakActivity: number[];
}

export interface AppearanceSettings {
  theme: "system" | "light" | "dark";
  accent: "indigo" | "emerald" | "rose";
  density: "comfortable" | "compact";
}

export interface UserProfile {
  displayName: string;
  bio: string;
  avatar: string;
}

export interface ServerState {
  bookmarks: Bookmark[];
  profile: UserProfile;
  billingHistory: BillingHistory[];
  appearance: AppearanceSettings;
  queryAiHistory: Array<{ query: string; response: string; timestamp: string }>;
}