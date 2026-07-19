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
  title: string;
  link: string;
  pubDate: string; // ISO string
  snippet: string;
  friendName: string;
  friendAvatar: string;
  friendUrl: string;
  isRecent: boolean;
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
