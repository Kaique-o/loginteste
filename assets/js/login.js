/*
  login robusto sem reload fantasma.

  mudanca importante:
  - nao usa form submit nativo.
  - botao entrar e type="button".
  - botao mostrar senha funciona antes de qualquer chamada ao supabase.
  - supabase-js so e carregado quando realmente precisa autenticar.
*/
(function inicializarLogin(global) {
  'use strict';

  const {
    getRequiredElement,
    showMessage,
    clearMessage,
    playFailureAnimation,
    playSuccessAnimation,
    setButtonLoading,
    delay,
    withTimeout,
    getRuntimeDiagnostics,
    marcarAppPronto
  } = global.AppHelpers;

  const LOGIN_TIMEOUT_MS = 15000;
  const SESSION_CHECK_TIMEOUT_MS = 8000;

  let isSubmitting = false;

  document.addEventListener('DOMContentLoaded', () => {
    const loginBox = getRequiredElement('login_form');
    const emailInput = getRequiredElement('email');
    const passwordInput = getRequiredElement('senha');
    const loginButton = getRequiredElement('login_button');
    const loginAlert = getRequiredElement('login_alert');
    const configAlert = getRequiredElement('config_alert');
    const togglePasswordButton = getRequiredElement('toggle_password');

    const configStatus = global.getConfigStatus();
    const runtimeStatus = getRuntimeDiagnostics();
    const urlParams = new URLSearchParams(global.location.search);
    const motivo = urlParams.get('motivo');

    marcarAppPronto();
    inicializarTela();
    registrarEventos();
    verificarSessaoExistente();

    function inicializarTela() {
      if (!configStatus.ok) {
        showMessage(configAlert, configStatus.message, 'warning');
        loginButton.disabled = true;
      }

      if (!runtimeStatus.ok) {
        showMessage(configAlert, runtimeStatus.message, 'warning');
        if (global.location.protocol === 'file:') {
          loginButton.disabled = true;
        }
      }

      if (motivo === 'sessao_obrigatoria') {
        showMessage(loginAlert, 'acesso bloqueado. faca login para abrir a home.', 'warning');
        playFailureAnimation(loginBox);
      }

      if (motivo === 'javascript_obrigatorio') {
        showMessage(loginAlert, 'ative javascript para validar sua sessao com seguranca.', 'warning');
      }
    }

    function registrarEventos() {
      /*
        alterna visibilidade da senha.
        nao depende de supabase, cdn, internet nem import externo.
      */
      togglePasswordButton.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePasswordButton.textContent = isPassword ? 'ocultar' : 'mostrar';
        togglePasswordButton.setAttribute('aria-pressed', String(isPassword));
        passwordInput.focus();
      });

      /*
        limpa somente erro visual do campo editado.
        nao apaga alerta global para nao sumir com a causa do erro.
      */
      [emailInput, passwordInput].forEach((input) => {
        input.addEventListener('input', () => {
          loginBox.classList.remove('is-error');
          input.removeAttribute('aria-invalid');
        });
      });

      /*
        clique no botao entrar.
        como o botao nao e submit, nao existe reload nativo do navegador.
      */
      loginButton.addEventListener('click', fazerLogin);

      /*
        enter dentro dos campos tambem chama login, sem submit nativo.
      */
      [emailInput, passwordInput].forEach((input) => {
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            fazerLogin();
          }
        });
      });
    }

    async function fazerLogin() {
      if (isSubmitting) {
        return;
      }

      let loginApproved = false;

      if (!configStatus.ok) {
        showMessage(loginAlert, configStatus.message, 'warning');
        playFailureAnimation(loginBox);
        return;
      }

      if (!runtimeStatus.ok) {
        showMessage(loginAlert, runtimeStatus.message, 'warning');
        playFailureAnimation(loginBox);
        return;
      }

      const validation = validarFormulario();
      if (!validation.ok) {
        showMessage(loginAlert, validation.message, 'error');
        playFailureAnimation(loginBox);
        return;
      }

      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      isSubmitting = true;
      setButtonLoading(loginButton, true, 'validando...', 'entrar');
      loginBox.classList.add('is-loading');
      showMessage(loginAlert, 'validando login no supabase...', 'warning');

      try {
        const supabase = await withTimeout(
          global.getSupabaseClient(),
          LOGIN_TIMEOUT_MS,
          'timeout ao carregar biblioteca do supabase.'
        );

        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          LOGIN_TIMEOUT_MS,
          'tempo esgotado. o supabase nao respondeu em 15 segundos.'
        );

        if (error) {
          emailInput.setAttribute('aria-invalid', 'true');
          passwordInput.setAttribute('aria-invalid', 'true');
          showMessage(loginAlert, tratarErroLogin(error), 'error');
          playFailureAnimation(loginBox);
          return;
        }

        if (!data || !data.session) {
          showMessage(loginAlert, 'login retornou sem sessao. confira auth, url e publishable key no supabase.', 'error');
          playFailureAnimation(loginBox);
          return;
        }

        loginApproved = true;
        showMessage(loginAlert, 'login aprovado. abrindo home...', 'success');
        playSuccessAnimation(loginBox);
        loginButton.textContent = 'aprovado';
        criarConfetes();

        await delay(850);
        global.location.replace('./home.html');
      } catch (error) {
        showMessage(loginAlert, montarMensagemErroTecnico(error), 'error');
        playFailureAnimation(loginBox);
        console.error('[login]', error);
      } finally {
        loginBox.classList.remove('is-loading');
        isSubmitting = false;

        if (!loginApproved) {
          setButtonLoading(loginButton, false, 'validando...', 'entrar');
        }
      }
    }

    async function verificarSessaoExistente() {
      try {
        const supabase = await withTimeout(
          global.getSupabaseClient(),
          SESSION_CHECK_TIMEOUT_MS,
          'nao foi possivel carregar supabase para conferir a sessao anterior.'
        );

        const { data: sessionData } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_CHECK_TIMEOUT_MS,
          'nao foi possivel conferir a sessao anterior em 8 segundos.'
        );

        if (sessionData && sessionData.session) {
          global.location.replace('./home.html');
        }
      } catch (error) {
        // falha nesta checagem nao pode quebrar os botoes de login e mostrar senha.
        console.warn('[sessao inicial]', error);
      }
    }

    function validarFormulario() {
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      emailInput.removeAttribute('aria-invalid');
      passwordInput.removeAttribute('aria-invalid');
      clearMessage(loginAlert);

      if (!email && !password) {
        emailInput.setAttribute('aria-invalid', 'true');
        passwordInput.setAttribute('aria-invalid', 'true');
        return { ok: false, message: 'preenche email e senha antes de entrar.' };
      }

      if (!email) {
        emailInput.setAttribute('aria-invalid', 'true');
        return { ok: false, message: 'preenche o email.' };
      }

      if (!emailInput.validity.valid) {
        emailInput.setAttribute('aria-invalid', 'true');
        return { ok: false, message: 'email invalido. confere o formato.' };
      }

      if (!password) {
        passwordInput.setAttribute('aria-invalid', 'true');
        return { ok: false, message: 'preenche a senha.' };
      }

      if (password.length < 6) {
        passwordInput.setAttribute('aria-invalid', 'true');
        return { ok: false, message: 'senha muito curta. minimo de 6 caracteres.' };
      }

      return { ok: true, message: '' };
    }

    function criarConfetes() {
      const container = document.createElement('div');
      container.className = 'confetti-layer';
      container.setAttribute('aria-hidden', 'true');

      for (let index = 0; index < 28; index += 1) {
        const piece = document.createElement('span');
        piece.style.setProperty('--x', `${Math.random() * 100}%`);
        piece.style.setProperty('--delay', `${Math.random() * 0.18}s`);
        piece.style.setProperty('--rotate', `${Math.random() * 420}deg`);
        container.appendChild(piece);
      }

      document.body.appendChild(container);
      global.setTimeout(() => container.remove(), 1300);
    }

    function tratarErroLogin(error) {
      const message = String((error && error.message) || error || '');
      const normalized = message.toLowerCase();
      const status = Number((error && (error.status || error.code)) || 0);

      if (normalized.includes('invalid login credentials')) {
        return 'email ou senha invalidos.';
      }

      if (normalized.includes('email not confirmed')) {
        return 'email ainda nao confirmado. confirme o email antes de entrar.';
      }

      if (normalized.includes('failed to fetch') || normalized.includes('networkerror')) {
        return 'falha de rede. confira internet, url do supabase e bloqueio de cdn.';
      }

      if (normalized.includes('timeout') || normalized.includes('tempo esgotado')) {
        return 'timeout no login. o supabase nao respondeu no prazo.';
      }

      if (status === 400 || status === 401 || status === 403) {
        return 'login recusado pelo supabase. confira email, senha e confirmacao do usuario.';
      }

      return `falha no login: ${message || 'erro desconhecido.'}`;
    }

    function montarMensagemErroTecnico(error) {
      const message = String((error && error.message) || error || '');
      const normalized = message.toLowerCase();

      if (normalized.includes('biblioteca supabase nao carregou')) {
        return message;
      }

      if (normalized.includes('timeout') || normalized.includes('tempo esgotado')) {
        return 'timeout no login. tente de novo e confira se o supabase esta acessivel.';
      }

      if (normalized.includes('failed to fetch') || normalized.includes('networkerror')) {
        return 'falha de rede. confira internet, cors, csp ou url do supabase.';
      }

      return tratarErroLogin(error);
    }
  });
})(window);
