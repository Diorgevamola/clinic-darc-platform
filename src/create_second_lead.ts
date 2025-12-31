
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imbqaafoflyauggducun.supabase.co';
const supabaseKey = 'sb_secret_fBMaBgj2wSdIt3OSpMMQfw_FkWjcAo9';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: companies } = await supabase.from('empresas').select('id').limit(1);
    if (!companies || !companies.length) return console.error('No company found');
    const id_empresa = companies[0].id;

    const lead2 = {
        nome: "Lead Teste Segundo",
        telefone: "5511888888888",
        status: "Novo",
        id_empresa: id_empresa
    };

    const { data, error } = await supabase.from('leads').insert(lead2).select();
    if (error) console.error("Error creating lead 2:", error);
    else console.log("Success creating lead 2:", data);
}

run();
