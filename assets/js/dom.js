/*
  helpers pequenos de dom para evitar repeticao e padronizar feedback visual.
*/
export function getRequiredElement(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`elemento obrigatorio nao encontrado: #${id}`);
  }

  return element;
}

export function showMessage(element, message, type = 'error') {
  element.textContent = message;
  element.classList.remove('hidden', 'alert-error', 'alert-warning', 'alert-success', 'is-entering');
  element.classList.add(`alert-${type}`);

  // reinicia a animacao sempre que uma nova mensagem aparecer.
  window.requestAnimationFrame(() => {
    element.classList.add('is-entering');
  });
}

export function clearMessage(element) {
  element.textContent = '';
  element.classList.add('hidden');
  element.classList.remove('alert-error', 'alert-warning', 'alert-success', 'is-entering');
}

export function playFailureAnimation(element) {
  element.classList.remove('is-error');
  window.requestAnimationFrame(() => {
    element.classList.add('is-error');
  });
}

export function playSuccessAnimation(element) {
  element.classList.remove('is-success');
  window.requestAnimationFrame(() => {
    element.classList.add('is-success');
  });
}

export function setButtonLoading(button, isLoading, loadingText, defaultText) {
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : defaultText;
  button.setAttribute('aria-busy', String(isLoading));
}

export function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function getRuntimeDiagnostics() {
  const issues = [];

  if (window.location.protocol === 'file:') {
    issues.push('vc abriu via arquivo local. rode em http://localhost usando um servidor estatico.');
  }

  if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    issues.push('origem nao segura. em producao use https para evitar falha de storage/sessao.');
  }

  if (!window.localStorage) {
    issues.push('localStorage indisponivel. o supabase precisa disso para persistir a sessao.');
  }

  return {
    ok: issues.length === 0,
    message: issues.join(' ')
  };
}

