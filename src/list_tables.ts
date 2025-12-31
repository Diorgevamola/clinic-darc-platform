
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imbqaafoflyauggducun.supabase.co';
const supabaseKey = 'sb_secret_fBMaBgj2wSdIt3OSpMMQfw_FkWjcAo9';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    // Note: maybe direct query to information_schema is restricted.
    // Let's try to just fetch some common names too.

    console.log("--- Tables in public ---");
    if (error) {
        console.error("Information schema error (expected if restricted):", error.message);

        // Alternative: Try to fetch from 'atendentes' or other guesses
        const check = async (name: string) => {
            const { error } = await supabase.from(name).select('*').limit(0);
            if (!error) console.log(`Table exists: ${name}`);
            else if (error.code !== 'PGRST204') console.log(`Table ${name} check returned: ${error.message}`);
        }

        await check('atendentes');
        await check('atendente');
        await check('atendimento');
        await check('chats');
        await check('mensagens');
    } else {
        console.log(tables?.map(t => t.table_name));
    }
}

run();
