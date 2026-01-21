import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ONLY Company Blogs are trusted now
const trustedDomains = ['openai.com', 'anthropic.com', 'blog.google', 'deepmind.google'];

const isTrusted = (url) => trustedDomains.some(d => url.includes(d));

async function run() {
    console.log('🔍 Identifying stories to rollback...');
    
    // 1. Get Sources mapping
    const { data: sources } = await supabase.from('sources').select('name, url');
    const sourceMap = {};
    sources.forEach(s => sourceMap[s.name] = s.url);

    // 2. Get APPROVED stories
    const { data: stories } = await supabase
        .from('stories')
        .select('id, source')
        .eq('status', 'approved');

    if (!stories) {
        console.log('No approved stories found.');
        return;
    }

    // 3. Filter stories from UNTRUSTED sources
    const idsToRevert = stories
        .filter(story => {
            const url = sourceMap[story.source];
            // If source not found, assume unsafe -> revert? Or safe?
            // Safer to revert.
            if (!url) return true; 
            return !isTrusted(url);
        })
        .map(s => s.id);
    
    console.log(`⚠️ Found ${idsToRevert.length} stories from general tech sites (The Verge, TechPoint, etc) that need review.`);

    if (idsToRevert.length === 0) return;

    // 4. Update status to 'pending'
    const { error } = await supabase
        .from('stories')
        .update({ status: 'pending' })
        .in('id', idsToRevert);

    if (error) {
        console.error('Error reverting stories:', error);
    } else {
        console.log(`✅ Rolled back ${idsToRevert.length} stories to Pending state.`);
    }
}

run();
