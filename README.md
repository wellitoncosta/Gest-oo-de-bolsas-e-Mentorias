# Gestão de Bolsas e Agendamento de Mentorias

Plataforma web completa para gestão de bolsas de estudo e agendamento de mentorias. Trabalho académico desenvolvido com React + Node.js + Express + Prisma + SQLite.

## Requisitos

- Node.js 18+ 
- npm

## Instalação

1. Clone ou descarregue o projeto
2. Instalar dependências (na raiz):

```bash
npm install
npm run install:all
```

Ou instalar manualmente:
```bash
cd client && npm install
cd ../server && npm install
```

## Configuração

### Servidor (.env)

Copie `.env.example` para `.env` na pasta `server/`:

```bash
cd server
cp .env.example .env
```

Configure as variáveis:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL="file:./dev.db"
JWT_SECRET=seu_segredo_aqui
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu_email@gmail.com
SMTP_PASS=senha_de_app_do_gmail
MAIL_FROM=seu_email@gmail.com

NODE_ENV=development
```

### Scripts úteis (server)
```bash
npm run normalizar-emails  # Normaliza emails existentes para minúsculas
npm run seed               # Popula base com dados demo
```

### Cliente (.env)

Opcional. Copie `client/.env.example` para `client/.env` se quiser alterar o URL da API:

```env
VITE_API_URL=http://localhost:5000/api
```

### Configurar Gmail (Senha de App)

Para enviar emails reais de recuperação de senha:

1. Ative a verificação em 2 passos na sua conta Google
2. Aceda a [Senhas de app do Google](https://myaccount.google.com/apppasswords)
3. Crie uma nova senha de app para "Mail"
4. Cole essa senha em `SMTP_PASS`

**Nota:** Se `SMTP_USER` e `SMTP_PASS` não estiverem configurados, o código de recuperação será impresso na consola do servidor (modo desenvolvimento), facilitando os testes.

## Base de dados e Seed

Na pasta `server/`:

```bash
npx prisma db push
npm run seed
```

Ou a partir da raiz:
```bash
npm run seed
```

### Conteúdo em português e inglês

As bolsas guardam os campos originais em português e os campos opcionais `tituloEn`, `descricaoEn`, `requisitosEn` e `valorEn`. Mentores podem guardar `biografiaEn`. As áreas são armazenadas como chaves estáveis (`tecnologia`, `engenharia`, `saude`, `educacao`, `gestao`, `ciencias`, `artes` e `outra`) e apresentadas com tradução conforme o idioma ativo.

Para adicionar os campos e normalizar as áreas de uma base existente, execute na pasta `server/`, indicando primeiro uma cópia de teste da base:

```bash
npm run migrate:content -- caminho/para/dev.db
```

O script é idempotente e aceita um caminho de base explícito. As traduções em inglês são opcionais; quando faltam, o cliente mostra o texto original e indica que está disponível apenas em português.

## Executar a aplicação

A partir da raiz do projeto:

```bash
npm run dev
```

Isto inicia simultaneamente o cliente (http://localhost:5173) e o servidor (http://localhost:5000).

## Utilizadores de teste

Após executar o seed:

| Perfil | Email | Senha |
|---|---|---|
| Administrador | admin@demo.com | Admin123! |
| Mentor | ana.mentor@demo.com | Pass123! |
| Mentor | carlos.mentor@demo.com | Pass123! |
| Estudante | joao.estudante@demo.com | Pass123! |
| Estudante | maria.estudante@demo.com | Pass123! |

## Funcionalidades

- **Visitantes**: Navegam livremente por Início, Dashboard, Bolsas, Mentores
- **Estudantes**: Registo/login, candidatura a bolsas, agendamento de mentorias, gestão de conta
- **Mentores**: Gestão de disponibilidades, confirmação/recusa de mentorias
- **Admin**: CRUD completo de bolsas, utilizadores e mentorias, estatísticas

## Endpoints principais (API)

### Autenticação (`/api/auth`)
- `POST /registar` - Registo (emails normalizados trim+lowercase, mensagem "Email já registado" mantida)
- `POST /login` - Login (emails normalizados trim+lowercase, 403 CONTA_BLOQUEADA se bloqueado)
- `POST /logout` - Logout
- `GET /me` - Utilizador atual (403 CONTA_BLOQUEADA se bloqueado)
- `POST /recuperacao/pedir` - Pedir código (404 se não existe, 403 se bloqueado, 429 cooldown 60s, 502 se falhar SMTP). Responde `{ mensagem: 'Código enviado para o seu email.', segundosReenvio: 60 }`
- `POST /recuperacao/validar-codigo` - Validar código (5 tentativas, devolve `resetToken` válido 10 min)
- `POST /recuperacao/redefinir` - Redefinir senha com `resetToken` (invalida todos os resets do utilizador)

### Bolsas (`/api/bolsas`)
- `GET /` - Listar (com filtros search, area, status)
- `GET /:id` - Detalhe (sem candidaturas, inclui totalCandidaturas). Rejeita candidatura se prazo vencido
- `POST /` - Criar (Admin)
- `PUT /:id` - Editar (Admin)
- `DELETE /:id` - Remover (Admin)

### Candidaturas (`/api/candidaturas`)
- `POST /bolsa/:bolsaId` - Candidatar (Estudante). Rejeita se prazo vencido ou bolsa fechada
- `GET /minhas` - Minhas candidaturas (Estudante)
- `GET /` - Todas (Admin)
- `PUT /:id/estado` - Alterar estado (Admin)
- `DELETE /:id` - Cancelar (Estudante) - apenas pendentes

### Mentorias (`/api/mentorias`)
- `GET /mentores` - Listar mentores (sem email/telefone)
- `GET /mentores/:id` - Detalhe mentor (sem email/telefone)
- `GET /disponibilidades` - Listar apenas horários LIVRES e FUTUROS (sem dados de estudantes)
- `GET /minhas-disponibilidades` - Meus horários (apenas MENTOR, com dados do estudante se ocupado)
- `POST /disponibilidades` - Criar disponibilidade (Mentor). Valida formato, não passado, horaFim>horaInicio, sem sobreposição
- `DELETE /disponibilidades/:id` - Remover disponibilidade (Mentor). Impedido se PENDENTE/CONFIRMADA
- `POST /agendar` - Agendar (Estudante). Transação com verificação, valida futuro, responde 409 se ocupado
- `GET /minhas` - Minhas mentorias
- `PUT /:id/estado` - Alterar estado com matriz de permissões rigorosa (403/400 consoante caso)
- `GET /` - Todas (Admin)

### Conta (`/api/conta`)
- `GET /` - Ver perfil
- `GET /resumo` - Contagens e atividade recente do utilizador autenticado
- `PUT /` - Editar perfil
- `PUT /senha` - Alterar senha
- `DELETE /` - Apagar conta (exige senha atual no body; impede apagar último admin)

### Dashboard (`/api/dashboard`)
- `GET /estatisticas` - Estatísticas públicas
- `GET /minha-area` - Dados do utilizador autenticado

### Utilizadores (`/api/utilizadores`)
- `GET /` - Listar (Admin) com campo `bloqueado`
- `PUT /:id/bloqueio` - Bloquear/Desbloquear (Admin). Não pode bloquear a si próprio nem outro ADMIN

## Regras de permissões
- **Mentor**: gere disponibilidades e só pode alterar estado das suas mentorias conforme matriz (PENDENTE→CONFIRMADA/RECUSADA/CANCELADA, CONFIRMADA→CONCLUIDA/CANCELADA)
- **Estudante**: só pode cancelar as suas mentorias (PENDENTE/CONFIRMADA). Não pode confirmar/concluir
- **Admin**: transições válidas conforme regras, pode gerir tudo. Não pode apagar própria conta nem último admin
- **Navbar**: Visitantes veem Início, Dashboard, Bolsas, Mentores, Entrar, Registar. Com sessão: adiciona Minha Conta e Candidaturas (apenas ESTUDANTE); Mentorias apenas para não-Admin; Admin apenas para ADMIN.
- **Bloqueio**: Contas bloqueadas recebem 403 com `codigo: CONTA_BLOQUEADA`. Login recusado mesmo com senha correta. Mentores bloqueados não aparecem publicamente. Admin não pode bloquear a si próprio nem outros admins. Histórico de sessões termina com efeito imediato.

## Tecnologias

- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Recharts
- **Backend**: Node.js, Express, Zod, JWT, bcryptjs, Nodemailer, express-rate-limit
- **Base de dados**: SQLite, Prisma ORM

## Guia visual do cliente

### Tokens de design

O cliente usa as variáveis RGB de `client/src/design/tokens.css`, com valores para os temas claro e escuro. O Tailwind mapeia-as em `client/tailwind.config.js`; use classes como `bg-bg`, `bg-surface`, `border-border`, `text-text`, `text-muted`, `bg-brand` e `text-accent` em vez de cores fixas. O modo escuro é ativado pela classe `dark` no elemento raiz.

### Tema

`ThemeProvider` expõe `{ dark, toggle }` através de `useTheme()`. O tema escolhido fica em `localStorage` na chave `theme`; na primeira visita, a aplicação consulta a preferência do sistema. O script no `client/index.html` aplica o tema antes de o React iniciar para evitar um flash.

### Traduções

As traduções estão em `client/src/i18n/pt.json` e `client/src/i18n/en.json`, organizadas pelos namespaces `common`, `nav`, `auth`, `home`, `dashboard`, `scholarships`, `mentoring`, `account`, `admin`, `errors` e `status`. Para acrescentar texto, adicione a mesma chave nos dois ficheiros e use `useTranslation('namespace')` no componente. A língua selecionada fica em `localStorage` na chave `lang` e também atualiza `html.lang`. Para formatar datas, use `localeFor(i18n.language)` de `client/src/i18n` com as APIs `Intl`.

Mensagens de erro da API devem passar por `traduzirErro(err)` em `client/src/services/traduzirErro.js`: códigos conhecidos usam `errors.<codigo>` e, quando não há tradução, a mensagem do servidor é mantida. Para estados da API, use `traduzirEstado(estado)`.

### Componentes de interface

Os elementos reutilizáveis ficam em `client/src/components/ui`: `Button`, `Card`, `Badge`, campos `Input`/`Select`/`Textarea`, `Modal`, `Skeleton`, `EmptyState`, `Toast` e `KpiCard`. Importe-os nos ecrãs para manter espaçamento, estados e acessibilidade consistentes.

## Modelo de dados e fusos horários

As disponibilidades guardam `inicio` e `fim` como instantes UTC. Os campos `data`, `horaInicio` e `horaFim` permanecem apenas para compatibilidade e não devem ser usados em novas comparações. `User.fusoHorario` guarda o fuso IANA do utilizador (por omissão `Africa/Luanda`); horários apresentados no cliente são convertidos para esse fuso e devem incluir a abreviatura e a cidade. A base mantém os estados como `String`; candidaturas aceitam `PENDENTE` (submetida) e `EM_ANALISE`, além dos estados de decisão.

`Mentoria` também contém os campos opcionais `bolsaId`, `linkReuniao`, `avaliacao`, `comentarioAvaliacao` e `notaMentor`. `Candidatura` contém `notaInterna` e `pontuacao`. O link de reunião é copiado para a mentoria quando confirmada e só é devolvido aos seus participantes.

Antes de migrar a base existente, faça uma cópia de `server/prisma/dev.db`. Execute `node prisma/migrar-utc.js` dentro de `server/` (ou indique o caminho de outra base SQLite). O script converte as datas legadas interpretando-as em `Africa/Luanda` (UTC+1), pode ser repetido com segurança e apresenta um relatório. Depois sincronize o schema com `npx prisma db push` e gere o cliente com `npx prisma generate`. Para disponibilidades novas, envie `inicio` e `fim` em ISO UTC; os campos legados continuam a ser aceites nas rotas existentes.

## Atualizações em tempo real (SSE)

O cliente abre `GET /api/eventos` com `EventSource` e credenciais. Visitantes recebem apenas eventos públicos. Sessões válidas são associadas ao utilizador e cargo; eventos de candidatura, mentoria e bloqueio são enviados somente aos destinatários indicados abaixo. O servidor envia heartbeat a cada 25 segundos e o cliente tenta reconectar com backoff. Se a ligação cair, as páginas consultam novamente os dados a cada 30 segundos e também ao voltar ao separador.

| Evento | Destinatários | Conteúdo |
|---|---|---|
| `bolsa:criada`, `bolsa:atualizada`, `bolsa:removida` | Todos | Campos públicos mínimos da bolsa (ou o seu ID ao remover) |
| `candidatura:nova` | Administradores | ID da candidatura, utilizador e bolsa |
| `candidatura:estado` | Estudante dono e administradores | ID e estado |
| `mentoria:nova`, `mentoria:estado` | Mentor, estudante e administradores | ID, participantes e estado |
| `disponibilidade:alterada` | Todos | ID do mentor |
| `estatisticas:alteradas` | Todos | Sinal agregado, com debounce de 2 segundos |
| `conta:bloqueada` | Utilizador afetado | ID do utilizador; o cliente termina a sessão |

Para conferir em duas janelas do navegador, inicie `npm run dev`, autentique um estudante numa janela e um administrador na outra. Deixe ambas abertas em Bolsas/Mentorias, crie uma bolsa ou altere uma candidatura no painel Admin e confirme a atualização sem recarregar a página. Para reproduzir o teste automatizado, execute o seed num ambiente de desenvolvimento e rode `npm run test:sse` dentro de `server/`; o script liga três clientes SSE, cria e apaga uma bolsa temporária como admin, e verifica que o evento privado de candidatura não chega a outro estudante. É possível fornecer credenciais de teste com `SSE_TEST_ADMIN_EMAIL`, `SSE_TEST_ADMIN_PASSWORD`, `SSE_TEST_STUDENT_EMAIL`, `SSE_TEST_STUDENT_PASSWORD`, `SSE_TEST_OTHER_EMAIL` e `SSE_TEST_OTHER_PASSWORD`, ou trocar o endereço com `SSE_API_URL`.
