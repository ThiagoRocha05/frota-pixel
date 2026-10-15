# Frota Pixel Mobile

Batalha naval para **dois tablets ou celulares**, abrindo um link do **GitHub Pages**. Não precisa de computador ligado, aplicativo instalado ou conta para cada jogador. Interface em português, navios com visual pixel art, ondas animadas, efeitos de disparo, som opcional, salas por código e revanche. PC também funciona, mas o fluxo principal é por toque.

Jogue em https://thiagorocha05.github.io/frota-pixel/ . Backend ativo no Supabase, com teste real de sala, dois jogadores, 33 disparos, vitória e revanche aprovado. Interface responsiva por toque; validação em tablets físicos ainda pendente.

## Como jogar

1. Os dois jogadores abrem o mesmo link, por exemplo `https://SEU-USUARIO.github.io/frota-pixel/`.
2. Um informa seu nome e cria uma sala; compartilha o convite ou código de oito caracteres.
3. O outro entra na sala pelo convite ou digita o código.
4. Arraste os navios do estaleiro para a grade com o dedo ou mouse. Navios já posicionados podem ser arrastados por qualquer parte. Também é possível tocar em um navio e depois na casa inicial. Use GIRAR para mudar a orientação, DESFAZER para voltar, RETIRAR para devolver um navio ao estaleiro ou DISTRIBUIR para posicionar automaticamente. No teclado, R gira e Ctrl/Cmd+Z desfaz. A frota em preparação é salva ao atualizar a página.
5. Ambos confirmam as frotas. O primeiro jogador é sorteado.
6. No Radar, toque em uma casa e depois em **DISPARAR EM A1**, por exemplo. A confirmação evita disparos acidentais durante a rolagem.
7. Vence quem afundar os cinco navios. A revanche começa quando ambos a solicitarem.

Em telas menores, as abas MINHA FROTA e RADAR INIMIGO mantêm um tabuleiro grande de cada vez. Tablets largos podem mostrar os dois. Há posicionamento por arraste e também por toque/clique, sem obrigar um gesto específico. Pode jogar entre Android, iPad e outros navegadores modernos, inclusive em redes diferentes. A partida exige internet.

## Enquadramento e turnos

Durante o ataque, o mapa é dimensionado pela largura e pela altura disponíveis na janela, com o botão de disparo sempre no painel de combate. Em celulares deitados com pouca altura, os controles vão para a lateral. O botão TELA CHEIA é oferecido quando o navegador suporta essa função. A fase de montagem da frota continua com rolagem normal.

A sua vez é destacada na barra de status, no título da aba e em um aviso temporário. Se o som estiver ligado, toca um sinal; aparelhos com suporte também vibram. O alerta também aparece ao voltar à página quando já for sua vez. Não são notificações do sistema: o jogo precisa estar aberto e conectado, com sincronização de aproximadamente três segundos.

## Arquitetura

O GitHub Pages hospeda os arquivos estáticos da pasta `docs`. Uma Edge Function do Supabase recebe as ações e guarda o estado no Postgres. Não há servidor Node.js no aparelho do usuário. O projeto completo, inclusive o backend, fica no GitHub; a execução do backend ocorre no Supabase.

O estado é atualizado por consulta a cada três segundos enquanto a página está visível. Ao voltar do bloqueio de tela ou recuperar a internet, tenta sincronizar novamente. As posições adversárias nunca são enviadas ao navegador: somente a própria frota e os resultados dos tiros. Mudanças de turno são validadas no backend.

## Publicar tudo pelo navegador

### 1. Criar os projetos

Crie um repositório GitHub, por exemplo `frota-pixel`, com branch `main`, e envie o **conteúdo** desta pasta à raiz do repositório. As pastas `docs`, `supabase`, `test` e `.github` precisam ficar na raiz. Preserve `.github/workflows`; o upload deve incluir os dois arquivos YAML. Se seu método de upload ocultar pastas iniciadas por ponto, crie os arquivos pelo editor web do GitHub usando o caminho completo.

Use um projeto Supabase dedicado a este jogo. Se precisar criar um projeto, confira o plano e os limites apresentados na sua conta antes de confirmar. Esta entrega não contrata recursos nem promete gratuidade sem limites.

### 2. Preparar o banco

No projeto Supabase, abra o SQL Editor, copie todo o conteúdo de `supabase/schema.sql` e execute uma vez. Esse script cria apenas objetos com prefixo `frota_`. O acesso direto às tabelas pelo navegador é revogado; RLS fica habilitada sem políticas públicas. Não é necessário desabilitar RLS.

No gerenciamento de secrets das Edge Functions, adicione:

| Nome | Valor de exemplo |
| --- | --- |
| `ALLOWED_ORIGINS` | `https://SEU-USUARIO.github.io` |

Use a **origem**, sem `/frota-pixel/`, sem barra final. Para domínio próprio, informe a origem dele. Várias origens são separadas por vírgula. Não use `*`. Essa configuração limita chamadas feitas por navegadores; não substitui os tokens de sessão, que efetivamente autorizam as ações.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são disponibilizadas pelo ambiente da Edge Function hospedada. **Não copie a service role ou secret key para o GitHub, para docs/config.js ou para o navegador.**

### 3. Configurar o GitHub

Em Settings → Secrets and variables → Actions, crie:

| Tipo | Nome | Valor |
| --- | --- | --- |
| Variable | `SUPABASE_PROJECT_REF` | Identificador do projeto Supabase |
| Variable | `GAME_API_URL` | `https://SEU-PROJECT-REF.supabase.co/functions/v1/game` |
| Secret | `SUPABASE_ACCESS_TOKEN` | Token pessoal de acesso do Supabase para a implantação |

O token de implantação vai somente em **Secret**, nunca em Variable ou arquivo. Ele não é a chave do projeto. O workflow de frontend recebe somente a URL pública da função.

Em Settings → Pages → Build and deployment → Source, selecione **GitHub Actions**.

Em Actions, execute primeiro **Publicar servidor de salas**. Ele testa e publica a função `game`; a configuração `verify_jwt = false` é intencional porque o jogo usa tokens próprios de sala e não exige login Supabase. As ações autenticadas são validadas no handler. Criar sala e tentar entrar são operações públicas com limite de requisições.

Depois execute **Publicar Frota Pixel**. O workflow valida, configura a URL pública em `docs/config.js` e publica a pasta `docs`. O endereço fica disponível no resultado da implantação e em Settings → Pages. Os próximos pushes para `main` republicam a interface; alterações no backend pedem nova execução de **Publicar servidor de salas**. Alterações de esquema devem ser aplicadas no SQL Editor antes do backend correspondente.

**Alternativa sem workflow para o backend:** no editor web de Edge Functions do Supabase, crie `game` com os dois arquivos `index.ts` e `engine.js` de `supabase/functions/game/`; mantenha os nomes, o import relativo e desligue a verificação de JWT da função. O workflow é recomendado para manter a versão implantada alinhada ao código.

## Conferência depois da publicação

Abra a URL no primeiro tablet, crie uma sala e entre pelo segundo. Confirme as duas frotas e faça disparos nos dois sentidos. Bloqueie uma tela por alguns segundos, volte e confira a reconexão. Termine a partida e peça revanche nos dois aparelhos. Esse é o teste real que permanece pendente enquanto não houver um projeto conectado e publicado.

No SQL Editor, confirme o bloqueio das tabelas:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename in ('frota_rooms','frota_limits');
select has_table_privilege('anon','public.frota_rooms','select') as anon_can_read,
       has_table_privilege('authenticated','public.frota_rooms','select') as user_can_read;
```

Ambas as tabelas devem ter `rowsecurity = true`; as duas permissões de leitura devem ser `false`. Execute também o Security Advisor do Supabase e examine avisos referentes aos objetos `frota_`. As tabelas sem políticas públicas são intencionais: o serviço é seu único acesso.

## Dispositivos, sessões e regras

O jogo usa navegadores modernos com HTTPS. Safari/iPadOS e Chrome/Android precisam suportar ES modules, Web Crypto, Fetch e AbortSignal.timeout. Uma atualização do navegador pode ser necessária em tablets antigos. O manifesto permite oferecer abertura como aplicativo em navegadores compatíveis; o jogo continua sendo online e não inclui modo offline nem promete instalação nativa.

A sessão fica no armazenamento local do navegador, para retomar após atualizar ou fechar a página. Não apague os dados do site durante uma partida. Em um mesmo navegador/perfil há uma sessão ativa; para dois jogadores, use dois dispositivos ou perfis separados. O convite contém somente o código da sala, nunca o token privado. Qualquer pessoa que conheça o código pode ocupar a vaga ainda livre, por isso compartilhe-o apenas com o outro jogador.

A sala expira 24 horas depois da criação, mesmo se estiver em uso. As salas e contadores expirados são removidos na próxima criação de sala. Os dados permanecem no banco após reiniciar a função, dentro desse prazo. A ausência do adversário é indicada após cerca de 45 segundos sem contato. Não há derrota automática por desconexão, para tolerar o bloqueio de tela do tablet. Sair remove a sessão local; a vaga não é reaberta. Para trocar um jogador, crie outra sala.

Frota de cinco navios: 5, 4, 3, 3 e 2 casas. Navios podem encostar; sobreposição, curvas e ultrapassagem das bordas são proibidas. Cada disparo passa a vez, inclusive se acertar. A revanche exige a concordância dos dois. Animações respeitam redução de movimento e o som vem desligado.

## Desenvolvimento e testes

Node.js 24 é usado **somente no desenvolvimento e nos workflows**, não nos tablets.

```sh
npm test
npm run check
```

Os testes cobrem frota inválida, privacidade, autenticação de sessão, duas vagas, concorrência de entrada, criação idempotente, repetição de disparos, turnos, vitória e revanche. O transporte PostgREST é simulado nos testes do handler. Eles não equivalem a uma implantação no Supabase real ou a testes visuais em aparelhos reais.

Atualizações do banco usam comparação de versão para impedir gravações concorrentes perdidas. Cada ação tem um identificador para impedir duplicidade após retry. Tokens aleatórios de 256 bits são guardados no backend apenas por hash. O limite persistente é de 180 solicitações por minuto por IP de origem observado no gateway. A origem precisa ser configurada e as tabelas não são abertas ao público. Não há SDK externo no cliente nem dependências npm da aplicação.

## Solução de problemas

| Sintoma | O que verificar |
| --- | --- |
| Workflow falha com GAME_API_URL | Crie a Variable com a URL HTTPS completa da função game e execute novamente |
| Erro de origem/CORS | ALLOWED_ORIGINS deve ser exatamente a origem da página, sem caminho nem barra final |
| Erro 401 na função | Confira se verify_jwt está desligado para game e reimplante a configuração |
| Serviço indisponível | Confira schema.sql, secrets automáticos e logs da Edge Function |
| Tela sem salas funcionando | Abrir docs/index.html sozinho não basta; publique e configure o backend |
| Vaga já ocupada | Use a sessão original do navegador ou crie uma nova sala |
| Muitas solicitações | Aguarde um minuto; aparelhos na mesma saída de internet compartilham o limite |
| Estado não muda | Verifique internet, projeto ativo e URL da função; a sincronização é de aproximadamente três segundos |

## Decisão registrada

Problema: multiplayer em tablets sem PC ligado. Abordagem: GitHub Pages para a interface e Supabase para regras e salas persistentes. A versão com servidor local foi substituída porque exigia computador ligado. Regra reutilizável: hospedar a página e executar o multiplayer são responsabilidades distintas, ainda que todo o código fique no mesmo repositório.

Referências de configuração: [GitHub Pages com Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [deploy de Edge Functions](https://supabase.com/docs/guides/functions/deploy), [autenticação de funções](https://supabase.com/docs/guides/functions/auth), [CORS](https://supabase.com/docs/guides/functions/cors).
