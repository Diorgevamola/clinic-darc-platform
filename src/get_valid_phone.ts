
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imbqaafoflyauggducun.supabase.co';
const supabaseKey = 'sb_secret_fBMaBgj2wSdIt3OSpMMQfw_FkWjcAo9';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: companies, error } = await supabase.from('empresas').select('telefone').limit(1);
    if (error) console.error("Error:", error);
    else console.log("Valid Phone:", companies?.[0]?.telefone);
}

run();
