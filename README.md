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
- `POST /registar` - Registo (mensagem "Email já registado" mantida)
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /me` - Utilizador atual
- `POST /recuperacao/pedir` - Pedir código de recuperação (crypto.randomInt, resposta genérica)
- `POST /recuperacao/verificar` - Verificar código e alterar senha

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
- `DELETE /:id` - Cancelar (Estudante)

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
- `PUT /` - Editar perfil
- `PUT /senha` - Alterar senha
- `DELETE /` - Apagar conta (exige senha atual no body; impede apagar último admin)

### Dashboard (`/api/dashboard`)
- `GET /estatisticas` - Estatísticas públicas
- `GET /minha-area` - Dados do utilizador autenticado

### Utilizadores (`/api/utilizadores`)
- `GET /` - Listar (Admin)
- `DELETE /:id` - Remover (Admin). Impede apagar própria conta ou último admin

## Regras de permissões
- **Mentor**: gere disponibilidades e só pode alterar estado das suas mentorias conforme matriz (PENDENTE→CONFIRMADA/RECUSADA/CANCELADA, CONFIRMADA→CONCLUIDA/CANCELADA)
- **Estudante**: só pode cancelar as suas mentorias (PENDENTE/CONFIRMADA). Não pode confirmar/concluir
- **Admin**: transições válidas conforme regras, pode gerir tudo. Não pode apagar própria conta nem último admin
- **Navbar**: Visitantes veem Início, Dashboard, Bolsas, Mentores, Entrar, Registar. Com sessão: adiciona Minha Conta; Mentorias apenas para não-Admin; Admin apenas para ADMIN.

## Tecnologias

- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Recharts
- **Backend**: Node.js, Express, Zod, JWT, bcryptjs, Nodemailer, express-rate-limit
- **Base de dados**: SQLite, Prisma ORM
