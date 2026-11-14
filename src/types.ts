export interface Friend {
  name: string;
  url: string;
  avatar: string;
  description: string;
  rss?: string;
  issue_id?: number;
  siteshot?: string;
}

export interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string; // ISO string
  content: string;
  snippet: string;
  friendName: string;
  friendAvatar: string;
  friendUrl: string;
  isRecent: boolean;
}

export interface MetadataItem {
  id: string;
  title: string;
  link: string;
  description: string;
  content: string;
  author: string;
  authorUrl: string;
  avatar: string;
  publishedAt: string;
  source: string;
  sourceUrl: string;
}

export interface MetadataFeed {
  items: MetadataItem[];
  generatedAt: string;
  rangeStart: string;
  rangeEnd: string;
  total: number;
}

export interface AggregatedData {
  lastBuild: string;
  recentArticles: Article[];
  olderArticles: Article[];
  friendsCount: number;
  activeFeedsCount: number;
  recentUpdatesCount: number;
  friends: Friend[];
}
