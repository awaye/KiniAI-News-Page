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

const trustedDomains = [
    'openai.com', 'anthropic.com', 'blog.google', 'deepmind.google',
    'venturebeat.com', 'wired.com', 'theverge.com', 'arstechnica.com',
    'techcabal.com', 'techpoint.africa'
];

const isTrusted = (url) => trustedDomains.some(d => url.includes(d));

async function run() {
    console.log('🔍 Identifing trusted sources...');
    
    // 1. Get all sources
    const { data: sources, error } = await supabase.from('sources').select('name, url');
    if (error) {
        console.error('Error fetching sources:', error);
        return;
    }

    // 2. Filter trusted
    const trustedNames = sources
        .filter(s => isTrusted(s.url))
        .map(s => s.name);
    
    console.log(`✅ Found ${trustedNames.length} trusted sources:`, trustedNames);

    if (trustedNames.length === 0) return;

    // 3. Update stories
    const { data, error: updateError } = await supabase
        .from('stories')
        .update({ status: 'approved' })
        .in('source', trustedNames)
        .eq('status', 'pending')
        .select();

    if (updateError) {
        console.error('Error updating stories:', updateError);
    } else {
        console.log(`✨ Auto-approved ${data.length} existing stories!`);
    }
}

run();
