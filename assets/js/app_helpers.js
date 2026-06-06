/*
  helpers pequenos de dom.
  ficam em script classico para nao depender de modulo nem de cdn externo.
*/
(function registrarHelpers(global) {
  'use strict';

  function getRequiredElement(id) {
    const element = document.getElementById(id);

    if (!element) {
      throw new Error(`elemento obrigatorio nao encontrado: #${id}`);
    }

    return element;
  }

  function showMessage(element, message, type = 'error') {
    element.textContent = message;
    element.classList.remove('hidden', 'alert-error', 'alert-warning', 'alert-success', 'is-entering');
    element.classList.add(`alert-${type}`);

    // reinicia a animacao sempre que uma nova mensagem aparecer.
    window.requestAnimationFrame(() => {
      element.classList.add('is-entering');
    });
  }

  function clearMessage(element) {
    element.textContent = '';
    element.classList.add('hidden');
    element.classList.remove('alert-error', 'alert-warning', 'alert-success', 'is-entering');
  }

  function playFailureAnimation(element) {
    element.classList.remove('is-error');
    window.requestAnimationFrame(() => {
      element.classList.add('is-error');
    });
  }

  function playSuccessAnimation(element) {
    element.classList.remove('is-success');
    window.requestAnimationFrame(() => {
      element.classList.add('is-success');
    });
  }

  function setButtonLoading(button, isLoading, loadingText, defaultText) {
    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : defaultText;
    button.setAttribute('aria-busy', String(isLoading));
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function withTimeout(promise, timeoutMs, timeoutMessage) {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      window.clearTimeout(timeoutId);
    });
  }

  function getRuntimeDiagnostics() {
    const issues = [];

    if (window.location.protocol === 'file:') {
      issues.push('vc abriu via arquivo local. rode em http://localhost usando um servidor estatico.');
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      issues.push('origem nao segura. em producao use https para evitar falha de storage/sessao.');
    }

    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
    } catch (error) {
      issues.push('localStorage indisponivel. o supabase precisa disso para persistir a sessao.');
    }

    return {
      ok: issues.length === 0,
      message: issues.join(' ')
    };
  }

  function marcarAppPronto() {
    document.documentElement.classList.add('js-loaded');
  }

  global.AppHelpers = Object.freeze({
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
  });
})(window);
