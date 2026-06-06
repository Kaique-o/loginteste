# checklist de seguranca

## validado no codigo

- [x] publishable key real preenchida.
- [x] rest url do projeto preenchida.
- [x] sem `onclick` inline.
- [x] sem script inline executavel.
- [x] campo senha com `type="password"`.
- [x] autocomplete correto para email e senha.
- [x] login usando `supabase.auth.signInWithPassword`.
- [x] login so redireciona se `data.session` existir.
- [x] falha de login com animacao de shake e alerta vermelho.
- [x] aprovacao de login com animacao de sucesso e confetes.
- [x] home nasce com `protected_shell` travado.
- [x] home valida sessao com `supabase.auth.getSession` antes de liberar conteudo.
- [x] home redireciona sem sessao para login com motivo claro.
- [x] home escuta mudanca de auth com `onAuthStateChange`.
- [x] logout usando `supabase.auth.signOut`.
- [x] email do usuario renderizado com `textContent`, nao `innerHTML`.
- [x] csp basica nas paginas.
- [x] sem chave jwt hardcoded.
- [x] sem `sb_secret_` hardcoded.
- [x] sem `service_role` usado como chave do frontend.
- [x] fallback `noscript` na home redirecionando para login.

## pendente porque depende do seu supabase

- [ ] criar usuario de teste no supabase auth.
- [ ] testar login real com email e senha reais.
- [ ] configurar site url e redirect urls no supabase.
- [ ] habilitar rls em todas as tabelas expostas.
- [ ] criar policies corretas para `authenticated`.
- [ ] confirmar que `anon` nao consegue ler tabela sensivel.
- [ ] configurar dominio com https.
- [ ] preferir csp por header da hospedagem quando possivel.

## teste manual ponta a ponta

1. rode `python3 -m http.server 8080`.
2. acesse `http://localhost:8080/home.html` sem login.
3. resultado esperado: home nao deve aparecer; deve voltar para login com aviso de acesso bloqueado.
4. tente entrar com email invalido: deve mostrar validacao do navegador.
5. tente entrar com senha errada: formulario deve tremer e mostrar erro.
6. entre com usuario real do supabase: deve mostrar animacao verde e abrir `home.html`.
7. clique em sair: deve limpar sessao e voltar para login.
8. abra `home.html` em aba anonima: deve bloquear de novo.
9. tente consultar dados protegidos com role anon: deve bloquear se rls estiver correta.

## limite tecnico honesto

em app estatico, qualquer pessoa consegue abrir o arquivo `home.html` pelo navegador ou ver o codigo fonte. por isso a home nao deve conter segredo hardcoded. o bloqueio client-side serve para fluxo visual; dados sensiveis precisam vir do supabase somente depois da sessao e com rls correta.
