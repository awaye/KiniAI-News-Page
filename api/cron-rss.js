/**
 * RSS Ingestion Cron Job for Vercel
 * Runs on schedule to fetch AI stories from RSS feeds
 */

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const parser = new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'AI-Curator-Bot/1.0' }
});

const aiKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'deep learning',
    'gpt', 'llm', 'chatbot', 'neural', 'openai', 'anthropic', 'google ai',
    'deepmind', 'midjourney', 'dall-e', 'generative', 'automation',
    'claude', 'gemini', 'copilot', 'language model', 'transformer'
];

const isAIRelated = (title, content = '') => {
    const text = `${title} ${content}`.toLowerCase();
    return aiKeywords.some(keyword => text.includes(keyword));
};

const ingestFeed = async (supabase, source) => {
    try {
        const feed = await parser.parseURL(source.url);
        let added = 0, skipped = 0;

        for (const item of feed.items.slice(0, 15)) {
            const title = item.title?.trim();
            const url = item.link;

            if (!title || !url) { skipped++; continue; }

            const isAIFeed = source.url.includes('ai') || source.url.includes('artificial-intelligence');
            if (!isAIFeed && !isAIRelated(title, item.contentSnippet)) { skipped++; continue; }

            const { error } = await supabase.from('stories').insert({
                title, url,
                source: source.name,
                tag: source.tag,
                source_type: 'rss',
                status: 'pending',
                published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
            });

            if (error) { if (error.code === '23505') skipped++; }
            else { added++; }
        }
        return { source: source.name, added, skipped };
    } catch (err) {
        return { source: source.name, added: 0, skipped: 0, error: err.message };
    }
};

export default async function handler(req, res) {
    const startTime = Date.now();
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: sources, error } = await supabase
        .from('sources')
        .select('*')
        .eq('is_active', true);

    if (error) {
        return res.status(500).json({ error: `Failed to fetch sources: ${error.message}` });
    }

    if (!sources || sources.length === 0) {
        return res.status(200).json({ message: 'No active sources found', totalAdded: 0 });
    }

    const results = [];
    let totalAdded = 0;

    for (const source of sources) {
        const result = await ingestFeed(supabase, source);
        results.push(result);
        totalAdded += result.added;
    }

    return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        duration: `${Date.now() - startTime}ms`,
        sourcesProcessed: sources.length,
        totalAdded,
        results
    });
}
