import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newSources = [
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', tag: 'global' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', tag: 'global' },
  { name: 'The Guardian AI', url: 'https://www.theguardian.com/technology/artificialintelligenceai/rss', tag: 'global' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', tag: 'global' },
  { name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml', tag: 'global' },
  { name: 'Anthropic', url: 'https://www.anthropic.com/index.xml', tag: 'global' },
  { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', tag: 'global' },
  { name: 'ScienceDaily AI', url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml', tag: 'global' }
];

async function addSources() {
  console.log(`Adding ${newSources.length} sources...`);
  
  for (const source of newSources) {
    // Check if exists
    const { data: existing } = await supabase
      .from('sources')
      .select('id')
      .eq('url', source.url)
      .single();

    if (existing) {
      console.log(`Skipping ${source.name} (already exists)`);
      continue;
    }

    const { error } = await supabase
      .from('sources')
      .insert({
        name: source.name,
        url: source.url,
        tag: source.tag,
        is_active: true
      });

    if (error) {
      console.error(`Error adding ${source.name}:`, error.message);
    } else {
      console.log(`Added ${source.name}`);
    }
  }
}

addSources();
