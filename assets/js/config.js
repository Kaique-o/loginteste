/*
  configuracao publica do supabase.

  importante:
  - publishable key pode ficar no navegador.
  - secret key e service_role nunca podem ficar neste arquivo.
  - a seguranca real dos dados depende de rls nas tabelas do supabase.

  este arquivo usa window.APP_CONFIG de proposito.
  motivo: evitar import/export em modulo no login, pq se o cdn do supabase falhar
  o botao mostrar senha e as validacoes locais ainda precisam funcionar.
*/
(function configurarApp(global) {
  'use strict';

  const SUPABASE_CONFIG = Object.freeze({
    // url base usada pelo supabase-js.
    url: 'https://xneybhdmfakpvhfjczkz.supabase.co',

    // url rest informada por voce. fica pronta para futuras chamadas diretas via fetch.
    restUrl: 'https://xneybhdmfakpvhfjczkz.supabase.co/rest/v1/',

    // publishable key publica do projeto. nunca troque isso por secret ou service_role.
    publishableKey: 'sb_publishable_E4zhUZJvbYHwkc-ym12hyw_UeSklH0y'
  });

  function getConfigStatus() {
    const { url, restUrl, publishableKey } = SUPABASE_CONFIG;

    if (!url || !url.startsWith('https://') || !url.includes('.supabase.co')) {
      return {
        ok: false,
        message: 'url do supabase invalida. confira assets/js/config.js.'
      };
    }

    if (!restUrl || !restUrl.startsWith(`${url}/rest/v1/`)) {
      return {
        ok: false,
        message: 'rest url invalida. ela precisa apontar para /rest/v1/ do mesmo projeto.'
      };
    }

    if (!publishableKey || publishableKey.includes('...') || publishableKey === 'SUA_PUBLISHABLE_KEY') {
      return {
        ok: false,
        message: 'publishable key ainda esta como placeholder. cole a key real em assets/js/config.js.'
      };
    }

    if (!publishableKey.startsWith('sb_publishable_')) {
      return {
        ok: false,
        message: 'a chave publica precisa comecar com sb_publishable_. nao use anon antiga, secret ou service_role.'
      };
    }

    if (/service_role|secret|sb_secret_/i.test(publishableKey)) {
      return {
        ok: false,
        message: 'risco critico: nunca use secret key ou service_role no frontend.'
      };
    }

    return { ok: true, message: 'configuracao ok.' };
  }

  global.APP_CONFIG = SUPABASE_CONFIG;
  global.getConfigStatus = getConfigStatus;
})(window);
