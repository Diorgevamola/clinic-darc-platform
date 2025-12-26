import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Basic client for client-side usage or simple server queries
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

// Helper to match the import in actions.ts
export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseKey;

    if (typeof window === 'undefined') {
        const urlLog = url ? url.substring(0, 20) + '...' : 'UNDEFINED';
        const keyLog = key ? key.substring(0, 5) + '...' : 'UNDEFINED';
        console.log(`[Supabase-Lib] Creating client with URL: ${urlLog}, Key: ${keyLog}`);
    }

    return createSupabaseClient(url, key);
}
