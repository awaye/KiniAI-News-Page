/**
 * RSS Ingestion Script for AI Curator
 * Reads sources from Supabase sources table
 * 
 * Usage: node scripts/rss-ingest.js
 */

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import 'dotenv/config';

const parser = new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'AI-Curator-Bot/1.0' }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// AI keywords for filtering
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

// Trusted domains for auto-approval (Company Blogs only)
const trustedDomains = [
    'openai.com', 'anthropic.com', 'blog.google', 'deepmind.google'
];

const isTrusted = (url) => trustedDomains.some(d => url.includes(d));

const ingestFeed = async (source) => {
    console.log(`\n📡 ${source.name}`);

    try {
        const feed = await parser.parseURL(source.url);
        let added = 0;
        let skipped = 0;

        for (const item of feed.items.slice(0, 15)) {
            const title = item.title?.trim();
            const url = item.link;

            if (!title || !url) {
                skipped++;
                continue;
            }

            // Filter for AI content if it's a general feed
            const isAIFeed = source.url.includes('ai') || source.url.includes('artificial-intelligence');
            if (!isAIFeed && !isAIRelated(title, item.contentSnippet)) {
                skipped++;
                continue;
            }

            // Auto-approve trusted sources
            const status = isTrusted(source.url) ? 'approved' : 'pending';

            const { error } = await supabase.from('stories').insert({
                title,
                url,
                source: source.name,
                tag: source.tag,
                source_type: 'rss',
                status,
                published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
            });

            if (error) {
                if (error.code === '23505') skipped++; // Duplicate
                else console.error(`  ❌ ${error.message}`);
            } else {
                added++;
                console.log(`  ✅ ${title.slice(0, 50)}...`);
            }
        }

        console.log(`  📊 ${added} added, ${skipped} skipped`);
        return added;
    } catch (err) {
        console.error(`  ❌ Failed: ${err.message}`);
        return 0;
    }
};

const main = async () => {
    console.log('🚀 AI Curator RSS Ingestion');
    console.log(`📅 ${new Date().toLocaleString()}`);

    // Fetch active sources from database
    const { data: sources, error } = await supabase
        .from('sources')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('❌ Failed to fetch sources:', error.message);
        process.exit(1);
    }

    if (!sources || sources.length === 0) {
        console.log('⚠️ No active sources found. Add sources at /sources');
        process.exit(0);
    }

    console.log(`📋 Found ${sources.length} active sources`);

    let totalAdded = 0;
    for (const source of sources) {
        const added = await ingestFeed(source);
        totalAdded += added;
    }

    console.log(`\n✨ Done! Total stories added: ${totalAdded}`);
    console.log('📝 Visit /admin to approve pending stories');
};

main();
