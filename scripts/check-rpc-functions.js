const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://chatwoot-supabase.6gpkjl.easypanel.host/";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRpcFunctions() {
  try {
    console.log("\n🔍 Verificando funções RPC no banco...\n");
    
    const { data, error } = await supabase.rpc("schema", {});
    
    if (error) {
      console.log("Tentando listar funções via SQL...");
      
      // Tentar verificar através da tabela information_schema
      const result = await supabase
        .from("information_schema.routines")
        .select("routine_name")
        .ilike("routine_schema", "public");
        
      if (result.error) {
        console.log("❌ Não foi possível listar funções automaticamente");
        console.log("\nExecute este SQL no Supabase para verificar:");
        console.log("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';");
        return;
      }
      
      console.log("✅ Funções encontradas:");
      result.data?.forEach(fn => {
        console.log(`  - ${fn.routine_name}`);
      });
    }
  } catch (err) {
    console.error("Erro:", err.message);
  }
}

checkRpcFunctions();
