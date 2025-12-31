
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imbqaafoflyauggducun.supabase.co';
const supabaseKey = 'sb_secret_fBMaBgj2wSdIt3OSpMMQfw_FkWjcAo9';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching one empresa...");
    const { data: companies, error: errEmp } = await supabase.from('empresas').select('id, Nome').limit(1);

    if (errEmp || !companies || companies.length === 0) {
        console.error("Failed to fetch empresa:", errEmp);
        return;
    }

    const empresa = companies[0];
    console.log("Got empresa:", empresa);

    // Attempt 1: Try implicit schema discovery by failing
    // We try to insert an almost empty object to see what it complains about
    console.log("\n--- Attempting Empty Insert to find required columns ---");
    const { error: err1 } = await supabase.from('leads').insert({});
    if (err1) {
        console.log("Error 1 (Empty):", err1.message, err1.details || '');
    }

    // Attempt 2: Try Old Schema (lowercase)
    console.log("\n--- Attempting Insert with Old Schema (lowercase) ---");
    const leadOld = {
        nome: "Lead Teste Lower",
        telefone: "5511999999999",
        status: "Novo",
        id_empresa: empresa.id
    };
    const { data: d2, error: err2 } = await supabase.from('leads').insert(leadOld).select();
    if (err2) {
        console.log("Error 2 (Lowercase):", err2.message, err2.hint || '');
    } else {
        console.log("Success 2! Inserted:", d2);
        return;
    }

    // Attempt 3: Try Capitalized Schema (based on Empresas table style)
    console.log("\n--- Attempting Insert with Capitalized Schema ---");
    const leadCap = {
        Nome: "Lead Teste Cap",
        Telefone: "5511888888888",
        Status: "Novo",
        Id_empresa: empresa.id
    };
    const { data: d3, error: err3 } = await supabase.from('leads').insert(leadCap).select();
    if (err3) {
        console.log("Error 3 (Capitalized):", err3.message, err3.hint || '');
    } else {
        console.log("Success 3! Inserted:", d3);
    }

    // Attempt 4: Try 'empresa_id' instead of 'id_empresa'
    console.log("\n--- Attempting Insert with 'empresa_id' ---");
    const leadAltFK = {
        Nome: "Lead Teste AltFK",
        Telefone: "5511777777777",
        empresa_id: empresa.id
    };
    const { data: d4, error: err4 } = await supabase.from('leads').insert(leadAltFK).select();
    if (err4) {
        console.log("Error 4 (AltFK):", err4.message, err4.hint || '');
    } else {
        console.log("Success 4! Inserted:", d4);
    }
}

run();
