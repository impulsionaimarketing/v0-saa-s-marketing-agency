const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://oohfpxgryppemtqhcbbw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function exportRPCFunctions() {
  try {
    console.log('Conectando ao Supabase oficial...');
    
    const { data, error } = await supabase.rpc('get_functions', {});
    
    if (error) {
      console.log('Erro ao chamar RPC:', error.message);
      console.log('Tentando query SQL diretamente...');
      
      // Tentar query SQL
      const { data: functions, error: sqlError } = await supabase
        .from('information_schema.routines')
        .select('*')
        .eq('routine_schema', 'public');
      
      if (sqlError) {
        console.error('Erro:', sqlError);
        return;
      }
      
      console.log('Functions encontradas:', functions);
      fs.writeFileSync('rpc-functions-export.json', JSON.stringify(functions, null, 2));
    } else {
      console.log('Functions:', data);
      fs.writeFileSync('rpc-functions-export.json', JSON.stringify(data, null, 2));
    }
    
    console.log('Arquivo exportado: rpc-functions-export.json');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

exportRPCFunctions();
