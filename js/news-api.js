// Gaming News API Service
// Fetches real gaming news from multiple authentic sources

const FALLBACK_NEWS = [
    {
        title: 'New Gaming Trends in 2025',
        description: 'Explore the latest gaming trends and technologies shaping the industry.',
        publish_date: new Date().toISOString(),
        site_detail_url: 'https://www.gamesindustry.biz/',
        image: { screen_url: 'https://images.unsplash.com/photo-1538481143235-5d630e8c0551?w=500&h=300&fit=crop' }
    },
    {
        title: 'Top Games of December 2025',
        description: 'The hottest releases and updates this month.',
        publish_date: new Date(Date.now() - 86400000).toISOString(),
        site_detail_url: 'https://www.metacritic.com/browse/games/release-dates/games/date/',
        image: { screen_url: 'https://images.unsplash.com/photo-1556200853-21a968d20e15?w=500&h=300&fit=crop' }
    },
    {
        title: 'Esports Championship Finals',
        description: 'Major esports tournaments wrapping up the season.',
        publish_date: new Date(Date.now() - 172800000).toISOString(),
        site_detail_url: 'https://www.esportscharts.com/',
        image: { screen_url: 'https://images.unsplash.com/photo-1593642532400-2682a8a6b975?w=500&h=300&fit=crop' }
    }
];

/**
 * Fetch gaming news from RSS2JSON (converts RSS to JSON)
 * Uses gaming news RSS feeds from authentic sources
 * @param {number} pageSize - Number of articles to fetch
 * @returns {Promise<Array>} Array of news articles
 */
async function fetchGamingNews(pageSize = 6) {
    try {
        // RSS2JSON converts RSS feeds to JSON (CORS-friendly)
        // Aggregate multiple gaming-focused RSS feeds and filter for gaming content
        const rssFeeds = [
            'https://kotaku.com/rss',
            'https://www.polygon.com/rss/index.xml',
            'https://www.gamespot.com/feeds/mashup/',
            'https://www.pcgamer.com/rss/',
            'https://www.gamesindustry.biz/rss'
        ];

        const articles = [];

        // Helper regex to identify gaming-related content
        const gamingRegex = /\b(game|gaming|esport|esports|dlc|patch|update|release|beta|alpha|review|trailer|developer|studio|platform|season)\b/i;

        for (const feed of rssFeeds) {
            try {
                const feedUrl = encodeURIComponent(feed);
                const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`;
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    console.warn('Feed fetch failed:', feed, response.status);
                    continue;
                }
                const data = await response.json();
                if (!data || !data.items) continue;

                for (const item of data.items) {
                    const title = item.title || '';
                    const content = (item.content || item.description || '') + ' ' + title;
                    if (!gamingRegex.test(content)) {
                        // skip non-gaming articles
                        continue;
                    }

                    const publish_date = item.pubDate || item.isoDate || new Date().toISOString();
                    const url = item.link || item.guid || '';
                    const imageUrl = item.thumbnail || item.image || extractImageFromContent(item.content) || FALLBACK_NEWS[0].image.screen_url;

                    articles.push({
                        title: title,
                        description: item.description || item.content || '',
                        publish_date: publish_date,
                        site_detail_url: url,
                        image: { screen_url: imageUrl }
                    });
                }
            } catch (err) {
                console.warn('Error fetching/parsing feed', feed, err);
                continue;
            }
        }

        if (articles.length === 0) {
            return FALLBACK_NEWS.slice(0, pageSize);
        }

        // Deduplicate by URL
        const seen = new Set();
        const unique = [];
        for (const a of articles) {
            if (!a.site_detail_url) continue;
            if (seen.has(a.site_detail_url)) continue;
            seen.add(a.site_detail_url);
            unique.push(a);
        }

        // Sort by publish_date desc
        unique.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));

        return unique.slice(0, pageSize);
    } catch (error) {
        console.error('Error fetching gaming news:', error);
        return FALLBACK_NEWS.slice(0, pageSize);
    }
}

/**
 * Extract image URL from HTML content
 * @param {string} content - HTML content string
 * @returns {string|null} Image URL or null
 */
function extractImageFromContent(content) {
    if (!content) return null;
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = content.match(imgRegex);
    return match ? match[1] : null;
}

/**
 * Get the main featured article and side articles
 * @returns {Promise<Object>} Object with mainArticle and sideArticles
 */
async function getNewsForDisplay() {
    try {
        const articles = await fetchGamingNews(4);
        
        if (articles.length === 0) {
            return {
                mainArticle: null,
                sideArticles: []
            };
        }

        return {
            mainArticle: articles[0],
            sideArticles: articles.slice(1, 4)
        };
    } catch (error) {
        console.error('Error formatting news for display:', error);
        return {
            mainArticle: null,
            sideArticles: []
        };
    }
}

/**
 * Format date string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatNewsDate(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }
}
