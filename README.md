# supabase login app - v10

Pagina estatica de login com Supabase Auth e home protegida por validacao de sessao.

## como rodar local

```bash
cd supabase_login_app_v10_sem_reload
python3 -m http.server 8080
```

Abra:

```text
http://localhost:8080/
```

Nao abra dando dois cliques no html, porque `file://` quebra storage/sessao em alguns navegadores.

## correcao da v10

O app nao usa mais `type="module"` no boot do login. Isso evita o bug onde uma falha no carregamento externo do Supabase impedia todos os eventos da tela.

Agora o fluxo e:

1. scripts locais carregam primeiro;
2. botao mostrar senha ja funciona;
3. validacao de campos vazios ja funciona;
4. supabase-js so carrega quando o usuario tenta autenticar;
5. se der timeout, erro de rede, cdn bloqueado ou credencial invalida, a mensagem aparece no alerta.

## arquivos principais

```text
index.html
home.html
assets/css/styles.css
assets/js/config.js
assets/js/app_helpers.js
assets/js/supabase_runtime.js
assets/js/login.js
assets/js/home.js
```

## supabase

A chave publica ja esta preenchida em:

```text
assets/js/config.js
```

Nunca coloque `service_role`, `sb_secret` ou secret key no frontend.

## seguranca real dos dados

A home ser bloqueada no frontend evita exibicao visual sem sessao, mas nao substitui RLS.

Qualquer tabela real no Supabase precisa de Row Level Security e policies corretas.
