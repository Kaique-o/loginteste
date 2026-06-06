/*
  cliente unico do supabase.

  usamos esm.sh para rodar como app estatico sem build.
  para projeto com build, troque por npm install @supabase/supabase-js.
*/
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_CONFIG } from './config.js';

export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.publishableKey,
  {
    auth: {
      // renova token automaticamente enquanto a sessao estiver ativa.
      autoRefreshToken: true,

      // mantem a sessao entre reloads usando storage gerenciado pelo supabase-js.
      persistSession: true,

      // permite leitura segura de sessao vinda por url quando houver fluxo de auth.
      detectSessionInUrl: true
    }
  }
);
