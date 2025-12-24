
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iadszqykwfmpqntlzpol.supabase.co';
const supabaseKey = 'sb_secret_PS8mPpj6SKLn459VLxk7AA_Hwe5usyZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('numero_dos_atendentes')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
            // Also print values to see if one looks like a URL
            console.log('Values:', data[0]);
        } else {
            console.log('No data found in table.');
        }
    }
}

checkSchema();
