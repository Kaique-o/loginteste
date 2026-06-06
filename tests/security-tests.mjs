import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const rootDir = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(rootDir, file), 'utf8');

const files = {
  index: read('index.html'),
  home: read('home.html'),
  config: read('assets/js/config.js'),
  helpers: read('assets/js/app_helpers.js'),
  runtime: read('assets/js/supabase_runtime.js'),
  login: read('assets/js/login.js'),
  homeJs: read('assets/js/home.js'),
  styles: read('assets/css/styles.css')
};

const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push({ name, status: 'pass' });
  } catch (error) {
    checks.push({ name, status: 'fail', error: error.message });
    process.exitCode = 1;
  }
}

check('config usa a url base correta do projeto supabase', () => {
  assert.match(files.config, /url:\s*'https:\/\/xneybhdmfakpvhfjczkz\.supabase\.co'/);
});

check('config usa a rest url correta do projeto supabase', () => {
  assert.match(files.config, /restUrl:\s*'https:\/\/xneybhdmfakpvhfjczkz\.supabase\.co\/rest\/v1\/'/);
});

check('config esta com publishable key real preenchida', () => {
  assert.match(files.config, /sb_publishable_E4zhUZJvbYHwkc-ym12hyw_UeSklH0y/);
  assert.doesNotMatch(files.config, /publishableKey:\s*['"](?:sb_publishable_\.\.\.|SUA_PUBLISHABLE_KEY)['"]/);
});

check('config valida que a chave precisa ser sb_publishable', () => {
  assert.match(files.config, /startsWith\('sb_publishable_'\)/);
});

check('runtime nao contem chave jwt hardcoded', () => {
  const runtime = Object.values(files).join('\n');
  assert.doesNotMatch(runtime, /eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{20,}/);
});

check('runtime nao contem sb_secret hardcoded', () => {
  const runtime = Object.values(files).join('\n');
  assert.doesNotMatch(runtime, /sb_secret_[a-zA-Z0-9_-]+/);
});

check('runtime nao contem service_role hardcoded em valor de chave', () => {
  assert.doesNotMatch(files.config, /publishableKey:\s*['"][^'"]*service_role/i);
});

check('html nao usa onclick inline', () => {
  assert.doesNotMatch(files.index + files.home, /onclick\s*=/i);
});

check('html nao possui script inline executavel', () => {
  const scripts = [...(files.index + files.home).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.every((match) => /src\s*=/.test(match[1]) && match[2].trim() === ''));
});

check('scripts rodam como classico defer e nao dependem de type module no boot', () => {
  assert.doesNotMatch(files.index + files.home, /type="module"/i);
  assert.match(files.index, /assets\/js\/config\.js" defer/);
  assert.match(files.index, /assets\/js\/app_helpers\.js" defer/);
  assert.match(files.index, /assets\/js\/supabase_runtime\.js" defer/);
  assert.match(files.index, /assets\/js\/login\.js" defer/);
});

check('botao entrar nao e submit nativo para evitar reload fantasma', () => {
  assert.match(files.index, /id="login_button"[^>]*type="button"/s);
  assert.doesNotMatch(files.index, /<form\b/i);
  assert.match(files.index, /id="login_form" class="login-box" role="form"/);
});

check('botao mostrar senha possui type button e listener proprio', () => {
  assert.match(files.index, /id="toggle_password"[^>]*type="button"/s);
  assert.match(files.login, /togglePasswordButton\.addEventListener\('click'/);
  assert.match(files.login, /passwordInput\.type = isPassword \? 'text' : 'password'/);
  assert.match(files.login, /mostrar/);
  assert.match(files.login, /ocultar/);
});

check('enter nos campos nao submete a pagina e chama login controlado', () => {
  assert.match(files.login, /event\.key === 'Enter'/);
  assert.match(files.login, /event\.preventDefault\(\)/);
  assert.match(files.login, /fazerLogin\(\)/);
});

check('formulario usa campo email validavel', () => {
  assert.match(files.index, /type="email"/);
  assert.match(files.index, /autocomplete="username"/);
  assert.match(files.index, /required/);
});

check('formulario usa senha protegida e autocomplete correto', () => {
  assert.match(files.index, /type="password"/);
  assert.match(files.index, /autocomplete="current-password"/);
  assert.match(files.index, /minlength="6"/);
});

check('login carrega supabase somente depois do clique', () => {
  assert.match(files.login, /global\.getSupabaseClient\(\)/);
  assert.match(files.runtime, /import\('https:\/\/esm\.sh\/@supabase\/supabase-js@2'\)/);
  assert.doesNotMatch(files.login, /import\s+\{/);
});

check('login chama signInWithPassword e so redireciona com session', () => {
  assert.match(files.login, /signInWithPassword/);
  assert.match(files.login, /!data \|\| !data\.session/);
  assert.match(files.login, /global\.location\.replace\('\.\/home\.html'\)/);
});

check('login possui animacao de falha e aprovacao', () => {
  assert.match(files.login, /playFailureAnimation/);
  assert.match(files.login, /playSuccessAnimation/);
  assert.match(files.login, /criarConfetes/);
  assert.match(files.styles, /@keyframes shake/);
  assert.match(files.styles, /@keyframes approvePop/);
  assert.match(files.styles, /@keyframes confettiFall/);
});

check('login mostra aviso customizado para campos vazios', () => {
  assert.match(files.login, /preenche email e senha antes de entrar/);
  assert.match(files.login, /preenche o email/);
  assert.match(files.login, /preenche a senha/);
  assert.match(files.login, /email invalido/);
  assert.match(files.login, /senha muito curta/);
});

check('login mostra status visivel durante validacao', () => {
  assert.match(files.login, /validando login no supabase/);
  assert.match(files.login, /showMessage\(loginAlert/);
});

check('login possui timeout contra carregamento infinito', () => {
  assert.match(files.login, /LOGIN_TIMEOUT_MS\s*=\s*15000/);
  assert.match(files.login + files.helpers, /withTimeout/);
  assert.match(files.login, /timeout no login/);
});

check('login tem trava de duplo clique', () => {
  assert.match(files.login, /let isSubmitting = false/);
  assert.match(files.login, /if \(isSubmitting\)/);
});

check('login nao apaga alerta quando usuario edita campo', () => {
  assert.match(files.login, /nao apaga alerta global/);
  assert.doesNotMatch(files.login, /input\.addEventListener\('input'[\s\S]{0,240}clearMessage\(loginAlert\)/);
});

check('home nasce travada antes de validar sessao', () => {
  assert.match(files.home, /id="auth_gate"/);
  assert.match(files.home, /id="protected_shell" class="protected-shell is-locked"/);
  assert.match(files.styles, /\.protected-shell\.is-locked\s*{\s*display:\s*none;/);
});

check('home valida sessao antes de liberar conteudo', () => {
  assert.match(files.homeJs, /getSession\(\)/);
  assert.match(files.homeJs, /liberarHome\(data\.session, userData\.user\)/);
  assert.match(files.homeJs, /protectedShell\.classList\.remove\('is-locked'\)/);
});

check('home tem trava visual forcada antes de qualquer validacao', () => {
  assert.match(files.homeJs, /bloquearHomeVisual\(\);/);
  assert.match(files.homeJs, /protectedShell\.classList\.add\('is-locked'\)/);
  assert.match(files.homeJs, /global\.addEventListener\('pageshow'/);
});

check('home possui timeout para validacao de sessao', () => {
  assert.match(files.homeJs, /SESSION_TIMEOUT_MS\s*=\s*10000/);
  assert.match(files.homeJs, /timeout ao validar sessao/);
  assert.match(files.homeJs, /timeout ao confirmar usuario/);
});

check('home redireciona sem sessao com motivo claro', () => {
  assert.match(files.homeJs, /redirectToLogin\('sessao_obrigatoria'\)/);
  assert.match(files.login, /motivo === 'sessao_obrigatoria'/);
});

check('home reage a logout ou expiracao de sessao', () => {
  assert.match(files.homeJs, /onAuthStateChange/);
  assert.match(files.homeJs, /SIGNED_OUT/);
});

check('home faz logout pelo supabase auth', () => {
  assert.match(files.homeJs, /signOut\(\)/);
});

check('email do usuario e escrito com textContent', () => {
  assert.match(files.homeJs, /userEmail\.textContent/);
  assert.doesNotMatch(files.homeJs, /userEmail\.innerHTML/);
});

check('interface nao contem marca antiga', () => {
  const interfaceText = [files.index, files.home, files.styles].join('\n');
  const forbiddenBrand = new RegExp(['sky', 'line'].join('') + '|\\b' + 's' + 'k' + '\\b', 'i');
  assert.doesNotMatch(interfaceText, forbiddenBrand);
});

check('csp basica esta presente nas duas paginas', () => {
  assert.match(files.index, /Content-Security-Policy/);
  assert.match(files.home, /Content-Security-Policy/);
  assert.match(files.index, /frame-ancestors 'none'/);
  assert.match(files.home, /object-src 'none'/);
});

check('csp permite localhost sem forcar upgrade para https', () => {
  assert.doesNotMatch(files.index + files.home, /upgrade-insecure-requests/);
});

check('css tem fallback inline para localhost ou subpasta', () => {
  assert.match(files.index, /id="inline_css_fallback"/);
  assert.match(files.home, /id="inline_css_fallback"/);
  assert.match(files.index, /<link rel="stylesheet" href="assets\/css\/styles\.css">/);
  assert.match(files.home, /<link rel="stylesheet" href="assets\/css\/styles\.css">/);
  assert.match(files.index + files.home, /\.auth-shell/);
  assert.match(files.index + files.home, /\.protected-shell\.is-locked/);
});

check('interface nao contem textos removidos do login', () => {
  const interfaceText = [files.index, files.home].join('\n').toLowerCase();
  const forbidden = [
    'dica local',
    'use o email e senha cadastrados',
    'validacao de acesso',
    'erro treme, aprovado brilha',
    'acesso restrito',
    'acesso ao sistema',
    'sem service_role no front',
    'sem senha salva manualmente',
    'home travada sem sessao',
    'logout com limpeza da sessao'
  ];

  for (const term of forbidden) {
    assert.ok(!interfaceText.includes(term), `texto ainda presente: ${term}`);
  }
});

check('login usa layout minimalista sem painel lateral', () => {
  assert.doesNotMatch(files.index, /brand-panel/);
  assert.doesNotMatch(files.index, /security-list/);
  assert.doesNotMatch(files.index, /auth_visual/);
  assert.match(files.index, /<h1>entrar<\/h1>/);
});

check('interface remove texto painel seguro', () => {
  assert.doesNotMatch(files.index + files.home + read('README.md'), /painel seguro/i);
});

check('home confirma usuario no servidor antes de liberar', () => {
  assert.match(files.homeJs, /getUser\(\)/);
  assert.match(files.homeJs, /liberarHome\(data\.session, userData\.user\)/);
});

check('diagnostico local bloqueia abertura via file protocol', () => {
  assert.match(files.helpers, /window\.location\.protocol === 'file:'/);
  assert.match(files.login, /global\.location\.protocol === 'file:'/);
});

check('no script da home redireciona para login', () => {
  assert.match(files.home, /<noscript>/);
  assert.match(files.home, /javascript_obrigatorio/);
});

check('paleta final esta aplicada no css e fallback inline', () => {
  const styleRuntime = files.styles + files.index + files.home;
  assert.match(styleRuntime, /--primary-color:\s*#D9D9D9/i);
  assert.match(styleRuntime, /--secondary-color:\s*#020029/i);
  assert.match(styleRuntime, /--text-on-primary:\s*#000000/i);
  assert.match(styleRuntime, /--text-on-secondary:\s*#FFFFFF/i);
  assert.match(styleRuntime, /--animation-detail:\s*#FAECD6/i);
});

check('micro detalhe nao virou cor principal de superficie', () => {
  assert.doesNotMatch(files.styles, /--surface:\s*#FAECD6/i);
  assert.doesNotMatch(files.styles, /--bg:\s*#FAECD6/i);
});

check('fontes solicitadas estao configuradas', () => {
  const styleRuntime = files.styles + files.index + files.home;
  assert.match(styleRuntime, /LegacySansITCPro-Book/);
  assert.match(styleRuntime, /Sirius/);
  assert.match(styleRuntime, /--font-primary/);
  assert.match(styleRuntime, /--font-secondary/);
});

const passed = checks.filter((item) => item.status === 'pass').length;
const failed = checks.filter((item) => item.status === 'fail').length;

for (const item of checks) {
  if (item.status === 'pass') {
    console.log(`ok - ${item.name}`);
  } else {
    console.error(`falhou - ${item.name}: ${item.error}`);
  }
}

console.log(`\nresultado: ${passed} passou, ${failed} falhou`);
