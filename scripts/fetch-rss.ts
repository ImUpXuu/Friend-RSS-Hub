import Parser from 'rss-parser';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Define structures for our static output
interface Friend {
  name: string;
  url: string;
  avatar: string;
  description: string;
  rss?: string;
  issue_id?: number;
  siteshot?: string;
}

interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string; // ISO String
  content: string;
  snippet: string;
  friendName: string;
  friendAvatar: string;
  friendUrl: string;
  isRecent: boolean;
}

interface MetadataItem {
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

interface MetadataFeed {
  items: MetadataItem[];
  generatedAt: string;
  rangeStart: string;
  rangeEnd: string;
  total: number;
}

interface AggregatedData {
  lastBuild: string;
  recentArticles: Article[];
  olderArticles: Article[];
  friendsCount: number;
  activeFeedsCount: number;
  recentUpdatesCount: number;
  friends: Friend[];
}

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }
});

const FRIENDS_JSON_URL = 'https://raw.githubusercontent.com/ImUpXuu/xuhome/refs/heads/main/src/config/friends.json';

// Fetch remote friends list dynamically
async function getFriends(): Promise<Friend[]> {
  console.log(`Fetching remote friends list from ${FRIENDS_JSON_URL}...`);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  try {
    const res = await fetch(FRIENDS_JSON_URL, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as Friend[];
    if (Array.isArray(data) && data.length > 0) {
      console.log(`Successfully fetched ${data.length} friends dynamically from remote repository.`);
      return data;
    }
    throw new Error('Fetched data is empty or not an array');
  } catch (err) {
    clearTimeout(id);
    console.error(`Failed to fetch remote friends list dynamically: ${(err as Error).message}`);
    throw err; // Propagate error to avoid silent build failures or stale data
  }
}

// Robust fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
      }
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Clean text by stripping HTML tags
function stripHtml(htmlStr: string): string {
  if (!htmlStr) return '';
  // Strip script, style tags and their contents
  let text = htmlStr.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Strip other html tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

// Ensure clean link (resolve relative links)
function resolveLink(feedLink: string, itemLink: string): string {
  if (!itemLink) return feedLink;
  if (itemLink.startsWith('http://') || itemLink.startsWith('https://')) {
    return itemLink;
  }
  try {
    const base = new URL(feedLink);
    return new URL(itemLink, base.origin).toString();
  } catch {
    return itemLink;
  }
}

function createArticleId(friendUrl: string, title: string, link: string, pubDate: string): string {
  return createHash('sha256')
    .update(`${friendUrl}\n${title}\n${link}\n${pubDate}`)
    .digest('hex')
    .slice(0, 20);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildMetadataFeed(articles: Article[], generatedAt: Date): MetadataFeed {
  const rangeEnd = generatedAt.toISOString();
  const rangeStartDate = new Date(generatedAt.getTime() - 15 * 24 * 60 * 60 * 1000);
  const rangeStart = rangeStartDate.toISOString();
  const items = articles
    .filter(article => article.pubDate >= rangeStart && article.pubDate <= rangeEnd)
    .sort((a, b) => b.pubDate.localeCompare(a.pubDate))
    .map(article => ({
      id: article.id,
      title: article.title,
      link: article.link,
      description: article.snippet,
      content: article.content,
      author: article.friendName,
      authorUrl: article.friendUrl,
      avatar: article.friendAvatar,
      publishedAt: article.pubDate,
      source: article.friendName,
      sourceUrl: article.friendUrl,
    }));

  return {
    items,
    generatedAt: rangeEnd,
    rangeStart,
    rangeEnd,
    total: items.length,
  };
}

function buildRssXml(feed: MetadataFeed): string {
  const items = feed.items.map(item => `
    <item>
      <guid isPermaLink=\"false\">${escapeXml(item.id)}</guid>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description>${escapeXml(item.description)}</description>
      <content:encoded><![CDATA[${item.content.replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
      <author>${escapeXml(item.author)}</author>
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
      <source url=\"${escapeXml(item.sourceUrl)}\">${escapeXml(item.source)}</source>
    </item>`).join('');

  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\">
  <channel>
    <title>Friend RSS Hub</title>
    <link>https://friend.upxuu.com/</link>
    <description>Friends' recent blog updates</description>
    <lastBuildDate>${new Date(feed.generatedAt).toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>
`;
}

async function run() {
  const friends = await getFriends();
  const articles: Article[] = [];
  let activeFeedsCount = 0;

  console.log(`Starting aggregation for ${friends.length} friends...`);

  // Limit concurrency to avoid overloading network/rate-limits
  const CONCURRENCY = 6;
  const feedsWithRss = friends.filter(f => f.rss && f.rss.trim().length > 0);
  
  console.log(`Found ${feedsWithRss.length} friends with RSS feeds.`);

  const chunks: Friend[][] = [];
  for (let i = 0; i < feedsWithRss.length; i += CONCURRENCY) {
    chunks.push(feedsWithRss.slice(i, i + CONCURRENCY));
  }

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const chunk = chunks[chunkIdx];
    console.log(`Processing chunk ${chunkIdx + 1}/${chunks.length} (${chunk.map(f => f.name).join(', ')})...`);
    
    await Promise.all(chunk.map(async (friend) => {
      if (!friend.rss) return;
      try {
        const xmlText = await fetchWithTimeout(friend.rss);
        const parsed = await parser.parseString(xmlText);
        
        activeFeedsCount++;
        let count = 0;

        if (parsed.items && Array.isArray(parsed.items)) {
          parsed.items.forEach(item => {
            // Standardize publication date
            let dateStr = item.pubDate || item.isoDate || '';
            let date = new Date();
            
            if (dateStr) {
              date = new Date(dateStr);
            } else {
              // Try to fallback
              return; // Skip if no date at all
            }

            // Check for invalid dates
            if (isNaN(date.getTime())) {
              return; 
            }

            // Limit to articles published in the last 60 days to keep the build light and relevant
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            if (date < sixtyDaysAgo) {
              return;
            }

            // Sanitize and limit future dates
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            if (date > tomorrow) {
              date = now; // Cap to now
            }

            const title = item.title ? item.title.trim() : '无题';
            const link = resolveLink(friend.url, item.link || '');
            const content = item.content || item['content:encoded'] || item.contentSnippet || '';
            const plainText = stripHtml(content);
            const snippet = plainText.slice(0, 150) + (plainText.length > 150 ? '...' : '');
            const pubDate = date.toISOString();

            articles.push({
              id: createArticleId(friend.url, title, link, pubDate),
              title,
              link,
              pubDate,
              content,
              snippet: snippet || '快来点击阅读全文吧 ➜',
              friendName: friend.name,
              friendAvatar: friend.avatar || '',
              friendUrl: friend.url,
              isRecent: false // updated below
            });
            count++;
          });
        }
        console.log(`  ✓ parsed feed of ${friend.name} (${count} recent articles found)`);
      } catch (err) {
        console.warn(`  ✗ failed to fetch/parse feed of ${friend.name} (${friend.rss}): ${(err as Error).message}`);
      }
    }));
  }

  // Sort articles descending by date
  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Define date limit for "last 3 days" (72 hours)
  const buildTime = new Date();
  const threeDaysAgo = new Date(buildTime.getTime() - 3 * 24 * 60 * 60 * 1000);

  const recentArticles: Article[] = [];
  const olderArticles: Article[] = [];

  articles.forEach(article => {
    const articleDate = new Date(article.pubDate);
    if (articleDate >= threeDaysAgo) {
      article.isRecent = true;
      recentArticles.push(article);
    } else {
      olderArticles.push(article);
    }
  });

  // Compose aggregated data
  const outputData: AggregatedData = {
    lastBuild: buildTime.toISOString(),
    recentArticles,
    olderArticles: olderArticles.slice(0, 100), // Cap older articles to 100 to save space
    friendsCount: friends.length,
    activeFeedsCount,
    recentUpdatesCount: recentArticles.length,
    friends: friends.map(f => ({
      name: f.name,
      url: f.url,
      avatar: f.avatar,
      description: f.description,
      rss: f.rss,
      issue_id: f.issue_id,
      siteshot: f.siteshot
    }))
  };

  // Write output
  const dataDir = path.dirname(path.join(process.cwd(), 'src', 'data', 'aggregated.json'));
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'src', 'data', 'aggregated.json'),
    JSON.stringify(outputData, null, 2),
    'utf-8'
  );

  // Generate stable public feeds for blog consumers. These files are created at
  // build time so Vercel can serve them as static assets without a serverless
  // runtime, and both paths remain available for simple feed integrations.
  const metadataFeed = buildMetadataFeed(articles, buildTime);
  const publicDir = path.join(process.cwd(), 'public');
  const apiDir = path.join(publicDir, 'api');
  fs.mkdirSync(apiDir, { recursive: true });
  const metadataJson = JSON.stringify(metadataFeed, null, 2);
  const rssXml = buildRssXml(metadataFeed);
  for (const outputPath of [
    path.join(publicDir, 'moments.json'),
    path.join(apiDir, 'moments.json'),
  ]) {
    fs.writeFileSync(outputPath, metadataJson, 'utf-8');
  }
  for (const outputPath of [
    path.join(publicDir, 'moments.xml'),
    path.join(apiDir, 'moments.xml'),
    path.join(publicDir, 'rss.xml'),
  ]) {
    fs.writeFileSync(outputPath, rssXml, 'utf-8');
  }

  console.log(`\nAggregated Data Stats:`);
  console.log(`- Friends list count: ${outputData.friendsCount}`);
  console.log(`- Active feeds parsed successfully: ${outputData.activeFeedsCount}`);
  console.log(`- Updates in the last 3 days: ${outputData.recentUpdatesCount}`);
  console.log(`- Older articles (retained): ${outputData.olderArticles.length}`);
  console.log(`- Data written to /src/data/aggregated.json`);
}

run().catch(err => {
  console.error('Fatal error in fetch-rss:', err);
  process.exit(1);
});
