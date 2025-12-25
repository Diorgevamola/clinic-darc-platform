
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, 'test-supabase', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log("Inspecting TeuCliente table...");
    const { data, error } = await supabase
        .from('TeuCliente')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching TeuCliente:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Column keys:", Object.keys(data[0]));
            console.log("Sample row:", data[0]);
        } else {
            console.log("Table is empty, cannot infer columns from data.");
        }
    }
}

inspectTable();
