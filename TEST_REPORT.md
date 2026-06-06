# relatorio de testes - v10

## resultado

```text
44 passou
0 falhou
```

## correcao critica aplicada

O login deixou de depender de `type="module"` com import estatico do Supabase no carregamento da pagina.

Antes, se o import externo falhasse, nenhum listener era registrado. Resultado: o botao **entrar** parecia recarregar a tela e o botao **mostrar** nao fazia nada.

Agora:

- `entrar` nao e mais `submit`, e `type="button"`.
- nao existe mais `<form>` com submit nativo.
- enter nos campos e interceptado por JavaScript com `preventDefault()`.
- `mostrar senha` funciona sem depender do Supabase.
- Supabase so e carregado quando o login realmente precisa autenticar.
- se CDN, CSP, internet ou Supabase falharem, a mensagem aparece na tela.
- timeout de login segue em 15 segundos.
- home continua travada sem sessao.

## smoke test localhost

```text
/                                    200
/index.html                          200
/home.html                           200
/assets/css/styles.css               200
/assets/js/config.js                 200
/assets/js/app_helpers.js            200
/assets/js/supabase_runtime.js       200
/assets/js/login.js                  200
/assets/js/home.js                   200
```

## principais validacoes

- sem `onclick` inline.
- sem script inline executavel.
- sem `service_role` no frontend.
- sem `sb_secret` no frontend.
- publishable key preenchida.
- csp mantida.
- home nasce com `is-locked`.
- home libera somente apos `getSession()` + `getUser()`.
- logout via `supabase.auth.signOut()`.
- senha usa `autocomplete="current-password"`.
- email usa `autocomplete="username"`.
- mensagens de erro nao somem ao editar campos.
