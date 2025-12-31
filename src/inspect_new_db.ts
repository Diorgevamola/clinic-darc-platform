
import { createClient } from '@supabase/supabase-js';

// Hardcoded for inspection only
const supabaseUrl = 'https://imbqaafoflyauggducun.supabase.co';
const supabaseKey = 'sb_secret_fBMaBgj2wSdIt3OSpMMQfw_FkWjcAo9';

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting Empresas ---');
    const { data: empresas, error: errEmp } = await supabase.from('empresas').select('*').limit(1);
    if (errEmp) console.error('Error fetching empresas:', errEmp);
    else console.log('Empresas Row:', empresas?.[0] ? Object.keys(empresas[0]) : 'No data');

    console.log('--- Inspecting Leads ---');
    const { data: leads, error: errLead } = await supabase.from('leads').select('*').limit(1);
    if (errLead) console.error('Error fetching leads:', errLead);
    else console.log('Leads Row:', leads?.[0] ? Object.keys(leads[0]) : 'No data');

    // Also try 'empresa' just in case
    console.log('--- Inspecting Empresa (Legacy?) ---');
    const { data: legacy, error: errLeg } = await supabase.from('empresa').select('*').limit(1);
    if (errLeg) console.error('Error fetching empresa:', errLeg);
    else console.log('Empresa Row:', legacy?.[0] ? Object.keys(legacy[0]) : 'No data');
}

inspect();
