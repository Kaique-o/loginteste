/*
  protecao da home para hospedagem estatica.

  observacao tecnica:
  - nao existe bloqueio de rota no servidor quando o site e 100% estatico.
  - por isso a home nasce travada no html/css e so libera apos getSession + getUser.
  - dado sensivel precisa continuar protegido por rls no supabase.
*/
(function inicializarHome(global) {
  'use strict';

  const {
    getRequiredElement,
    showMessage,
    delay,
    withTimeout,
    getRuntimeDiagnostics,
    marcarAppPronto
  } = global.AppHelpers;

  const SESSION_TIMEOUT_MS = 10000;

  document.addEventListener('DOMContentLoaded', () => {
    const authGate = getRequiredElement('auth_gate');
    const protectedShell = getRequiredElement('protected_shell');
    const sessionLoading = getRequiredElement('session_loading');
    const homeAlert = getRequiredElement('home_alert');
    const userEmail = getRequiredElement('user_email');
    const logoutButton = getRequiredElement('logout_button');

    const configStatus = global.getConfigStatus();
    const runtimeStatus = getRuntimeDiagnostics();

    marcarAppPronto();
    bloquearHomeVisual();
    validarAcessoHome();

    /*
      se a pagina voltar do cache do navegador, trava de novo e revalida.
      isso evita home aberta pelo botao voltar depois de logout ou sessao expirada.
    */
    global.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        bloquearHomeVisual();
        validarAcessoHome();
      }
    });

    logoutButton.addEventListener('click', async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = 'saindo...';
      logoutButton.setAttribute('aria-busy', 'true');

      try {
        const supabase = await withTimeout(
          global.getSupabaseClient(),
          SESSION_TIMEOUT_MS,
          'timeout ao carregar supabase para logout.'
        );

        await withTimeout(
          supabase.auth.signOut(),
          SESSION_TIMEOUT_MS,
          'timeout ao sair.'
        );
      } finally {
        bloquearHomeVisual();
        redirectToLogin('sessao_obrigatoria');
      }
    });

    async function validarAcessoHome() {
      if (!configStatus.ok || !runtimeStatus.ok) {
        redirectToLogin('sessao_obrigatoria');
        return;
      }

      try {
        const supabase = await withTimeout(
          global.getSupabaseClient(),
          SESSION_TIMEOUT_MS,
          'timeout ao carregar supabase para validar sessao.'
        );

        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          'timeout ao validar sessao.'
        );

        if (error || !data || !data.session) {
          await negarAcesso();
          return;
        }

        const { data: userData, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          SESSION_TIMEOUT_MS,
          'timeout ao confirmar usuario.'
        );

        if (userError || !userData || !userData.user) {
          await negarAcesso();
          return;
        }

        registrarMudancaSessao(supabase);
        liberarHome(data.session, userData.user);
      } catch (error) {
        console.error('[home auth]', error);
        await negarAcesso();
      }
    }

    function registrarMudancaSessao(supabase) {
      if (global.__homeAuthListenerRegistered) {
        return;
      }

      global.__homeAuthListenerRegistered = true;

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED' || !session) {
          bloquearHomeVisual();
          redirectToLogin('sessao_obrigatoria');
          return;
        }

        validarSessaoAtual(supabase, session);
      });
    }

    async function validarSessaoAtual(supabase, session) {
      try {
        const { data: userData, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          SESSION_TIMEOUT_MS,
          'timeout ao revalidar usuario.'
        );

        if (userError || !userData || !userData.user) {
          bloquearHomeVisual();
          redirectToLogin('sessao_obrigatoria');
          return;
        }

        liberarHome(session, userData.user);
      } catch (error) {
        console.error('[home revalidacao]', error);
        bloquearHomeVisual();
        redirectToLogin('sessao_obrigatoria');
      }
    }

    function liberarHome(session, user) {
      // usa textContent para nao injetar html vindo do usuario.
      userEmail.textContent = user.email || session.user.email || 'usuario autenticado';

      authGate.classList.add('hidden');
      sessionLoading.classList.add('hidden');
      protectedShell.classList.remove('is-locked');
      protectedShell.classList.add('is-unlocked');
      document.body.classList.add('is-authenticated');
      showMessage(homeAlert, 'sessao aprovada. home liberada.', 'success');
    }

    function bloquearHomeVisual() {
      authGate.classList.remove('hidden', 'is-denied');
      sessionLoading.classList.remove('hidden');
      sessionLoading.textContent = 'validando sessao...';
      protectedShell.classList.add('is-locked');
      protectedShell.classList.remove('is-unlocked');
      document.body.classList.remove('is-authenticated');
    }

    async function negarAcesso() {
      showMessage(sessionLoading, 'sessao nao encontrada. redirecionando para login...', 'warning');
      authGate.classList.add('is-denied');
      await delay(450);
      redirectToLogin('sessao_obrigatoria');
    }

    function redirectToLogin(reason) {
      global.location.replace(`./index.html?motivo=${encodeURIComponent(reason)}`);
    }
  });
})(window);
