/*
  carregador tolerante do supabase-js.

  correcao principal da v10:
  - a tela e os botoes nao dependem mais de import estatico do cdn.
  - se o cdn/module falhar, a validacao local continua funcionando e o erro aparece na tela.
*/
(function registrarSupabaseRuntime(global) {
  'use strict';

  let clientPromise = null;
  let clientInstance = null;

  async function getSupabaseClient() {
    if (clientInstance) {
      return clientInstance;
    }

    if (clientPromise) {
      return clientPromise;
    }

    clientPromise = criarClienteSupabase();
    return clientPromise;
  }

  async function criarClienteSupabase() {
    const configStatus = global.getConfigStatus ? global.getConfigStatus() : { ok: false, message: 'config.js nao carregou.' };

    if (!configStatus.ok) {
      throw new Error(configStatus.message);
    }

    const createClient = await resolverCreateClient();
    const config = global.APP_CONFIG;

    clientInstance = createClient(
      config.url,
      config.publishableKey,
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

    return clientInstance;
  }

  async function resolverCreateClient() {
    // primeira tentativa: se alguem ja carregou o supabase global.
    if (global.supabase && typeof global.supabase.createClient === 'function') {
      return global.supabase.createClient;
    }

    // segunda tentativa: import dinamico. isso so roda na hora do login/home, nao na inicializacao da tela.
    try {
      const supabaseModule = await import('https://esm.sh/@supabase/supabase-js@2');

      if (typeof supabaseModule.createClient !== 'function') {
        throw new Error('createClient nao veio no modulo do supabase.');
      }

      return supabaseModule.createClient;
    } catch (error) {
      throw new Error(`biblioteca supabase nao carregou. confira internet, csp ou bloqueio de cdn. detalhe: ${error.message}`);
    }
  }

  global.getSupabaseClient = getSupabaseClient;
})(window);
