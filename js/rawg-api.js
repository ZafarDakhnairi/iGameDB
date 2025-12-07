// RAWG API Integration Service
// RAWG API Documentation: https://rawg.io/api
// Free plan allows up to 20,000 requests per month

const RAWG_API_KEY = '266fadd8dc914070b892d47f91163eeb'; // Sign up at https://rawg.io/api to get your free API key
const RAWG_BASE_URL = 'https://api.rawg.io/api';

// Function to fetch games list with filtering options
async function fetchGames(options = {}) {
    try {
        const {
            page = 1,
            pageSize = 20,
            ordering = '-rating', // '-rating', '-released', '-added'
            search = '',
            genres = '',
            platforms = '' // 1=PC, 2=PlayStation, 3=Xbox, 4=iOS, 5=Android
        } = options;

        let url = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&page=${page}&page_size=${pageSize}&ordering=${ordering}`;

        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        if (genres) {
            url += `&genres=${genres}`;
        }
        if (platforms) {
            url += `&platforms=${platforms}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching games:', error);
        return null;
    }
}

// Function to fetch specific game details
async function fetchGameDetails(gameId) {
    try {
        const url = `${RAWG_BASE_URL}/games/${gameId}?key=${RAWG_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching game details:', error);
        return null;
    }
}

// Function to fetch game screenshots
async function fetchGameScreenshots(gameId) {
    try {
        const url = `${RAWG_BASE_URL}/games/${gameId}/screenshots?key=${RAWG_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching screenshots:', error);
        return [];
    }
}

// Function to fetch game reviews (user ratings)
async function fetchGameReviews(gameId) {
    try {
        const url = `${RAWG_BASE_URL}/games/${gameId}/reviews?key=${RAWG_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

// Function to get trending games (most added recently, highest rated)
async function fetchTrendingGames() {
    return await fetchGames({
        page: 1,
        pageSize: 8,
        ordering: '-added'
    });
}

// Function to get fan favorites (highest rated)
async function fetchFanFavorites() {
    return await fetchGames({
        page: 1,
        pageSize: 4,
        ordering: '-rating'
    });
}

// Function to search games by query
async function searchGames(query) {
    console.log('searchGames() called with query:', query);
    
    if (!query || query.trim() === '') {
        console.warn('Empty search query');
        return { results: [] };
    }

    try {
        const data = await fetchGames({
            page: 1,
            pageSize: 40,
            search: query,
            ordering: '-relevance'  // Request results sorted by relevance
        });

        if (!data || !data.results) {
            console.warn('No data returned from fetchGames');
            return { results: [] };
        }

        console.log('Search returned', data.results.length, 'results');

        // Client-side filtering: prioritize exact matches and partial matches
        const normalizedQuery = query.toLowerCase();
        const scored = data.results.map(game => {
            const gameName = (game.name || '').toLowerCase();
            let score = 0;

            // Exact match
            if (gameName === normalizedQuery) score = 1000;
            // Starts with query
            else if (gameName.startsWith(normalizedQuery)) score = 500;
            // Contains query as word
            else if (gameName.includes(' ' + normalizedQuery) || gameName.includes(normalizedQuery + ' ')) score = 300;
            // Contains query anywhere
            else if (gameName.includes(normalizedQuery)) score = 100;
            else score = 0;

            return { game, score };
        });

        // Sort by score descending
        const filtered = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.game);

        console.log('After client-side filtering:', filtered.length, 'relevant results');

        return { results: filtered.length > 0 ? filtered : data.results };
    } catch (error) {
        console.error('Error in searchGames:', error);
        return { results: [] };
    }
}

// Function to fetch genres
async function fetchGenres() {
    try {
        const url = `${RAWG_BASE_URL}/genres?key=${RAWG_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching genres:', error);
        return [];
    }
}

// Function to fetch platforms
async function fetchPlatforms() {
    try {
        const url = `${RAWG_BASE_URL}/platforms?key=${RAWG_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching platforms:', error);
        return [];
    }
}
