# Segurança

Achou uma falha que deixa ler ou alterar o save de outro jogador, entrar na conta de alguém ou expor alguma
chave? **Não abra uma issue pública.** Use o botão **Report a vulnerability** na aba
[Security](https://github.com/miguel20br/soccermon/security/advisories/new) do repositório (aviso privado do
GitHub).

Conte o que encontrou e como reproduzir. A resposta vem assim que possível, e o crédito pela descoberta entra
nas notas da versão, se você quiser.

## O que está no escopo

- Regras de acesso do banco (`supabase/migrations/`): cada jogador só pode ler e escrever o próprio save.
- Login com Google e sessão (`src/cloud/`).
- O site publicado em soccermon.vercel.app.

Trapacear no próprio save local (editar o IndexedDB do seu navegador) não é falha de segurança: o jogo é
single player.
