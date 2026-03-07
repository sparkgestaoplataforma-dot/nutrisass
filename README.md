# NutriSaaS

Sistema de gestão SaaS para clínicas de nutrição. Multi-tenant, com isolamento completo de dados por clínica.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| **Monorepo** | Turborepo |
| **Frontend** | React 19 + Vite 6 + SCSS Modules + React Router 7 |
| **State** | Zustand (auth) + TanStack Query (server) |
| **Backend** | Node.js + Express 4 + Clean Architecture + DDD |
| **ORM** | Prisma 6 |
| **Database** | PostgreSQL (Railway) |
| **Cache** | Redis (opcional, para blacklist/refresh) |
| **Auth** | JWT (access 15m + refresh 7d) + Redis blacklist |
| **Validation** | Zod (schemas compartilhados front/back) |
| **Real-time** | Socket.io |
| **Forms** | react-hook-form + @hookform/resolvers |
| **Icons** | react-icons (Lucide) |

## Estrutura do Monorepo

```
├── apps/
│   ├── api/           # Backend Express + Prisma
│   └── web/           # Frontend React + Vite
├── packages/
│   └── shared/        # Schemas Zod, tipos, constantes
├── turbo.json
└── docker-compose.yml
```

## Quick Start

### Pré-requisitos

- Node.js 20+
- PostgreSQL (Railway ou Docker local)
- Redis (opcional)

### Instalação

```bash
git clone https://github.com/tallescarrelo/nutrisass.git
cd nutrisass
npm install
```

### Configuração

Crie o arquivo `apps/api/.env` baseado no `.env.example`:

```env
DATABASE_URL=postgresql://postgres:SENHA@mainline.proxy.rlwy.net:56640/railway
REDIS_URL=redis://localhost:6379
JWT_SECRET=sua-chave-secreta
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
API_PORT=3333
NODE_ENV=development
```

### Banco de Dados

```bash
cd apps/api
npx prisma migrate dev    # Aplicar migrations
npx tsx prisma/seed.ts    # Criar dados iniciais
```

### Rodar

```bash
npm run dev   # Inicia API (3333) + Web (5173) via Turborepo
```

### Usuários de Teste (Clínica Demo)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@nutricao.com | 123456 |
| Nutricionista | nutri@nutricao.com | 123456 |
| Secretária | secretaria@nutricao.com | 123456 |

## Arquitetura

### Multi-Tenancy

Cada clínica é um tenant isolado. O `clinicaId` é propagado via JWT e filtrado automaticamente em todas as queries.

```
Clínica (tenant)
  └── Usuários (admin, nutricionistas, secretárias)
  └── Pacientes
  └── Agendamentos
  └── Convênios
  └── Exames
```

### Backend (Clean Architecture + DDD)

```
src/modules/{modulo}/
  ├── application/     # Use-cases (lógica de negócio)
  ├── domain/          # Modelos de domínio
  ├── dtos/            # Data Transfer Objects
  └── infra/           # Controllers + Routes (Express)
```

### Perfis de Acesso

| Perfil | Permissões |
|--------|-----------|
| **ADMIN** | Tudo: usuários, convênios, configurações, agenda, pacientes |
| **NUTRICIONISTA** | Agenda, pacientes, prontuário, exames, relatórios |
| **SECRETÁRIA** | Agenda, pacientes (listagem), relatórios |

## Módulos

| Módulo | Descrição | Doc |
|--------|-----------|-----|
| Auth | Login, refresh token, logout | [docs/features/auth.md](docs/features/auth.md) |
| Clínica | Onboarding, dados da clínica | [docs/features/clinica.md](docs/features/clinica.md) |
| Dashboard | KPIs e agenda do dia | [docs/features/dashboard.md](docs/features/dashboard.md) |
| Agenda | Agendamentos + real-time | [docs/features/agenda.md](docs/features/agenda.md) |
| Pacientes | CRUD + busca paginada | [docs/features/pacientes.md](docs/features/pacientes.md) |
| Prontuário | Evolução clínica + medidas | [docs/features/prontuario.md](docs/features/prontuario.md) |
| Exames | Solicitação + resultados | [docs/features/exames.md](docs/features/exames.md) |
| Convênios | CRUD (admin only) | [docs/features/convenios.md](docs/features/convenios.md) |
| Usuários | CRUD (admin only) | [docs/features/usuarios.md](docs/features/usuarios.md) |
| Relatórios | Filtros + impressão | [docs/features/relatorios.md](docs/features/relatorios.md) |

## API Endpoints

Documentação completa: [docs/features/api-endpoints.md](docs/features/api-endpoints.md)

## Scripts

```bash
npm run dev          # Dev mode (API + Web)
npm run build        # Build de produção
npm run lint         # TypeScript check

# API específicos
cd apps/api
npm run db:migrate   # Prisma migrate dev
npm run db:seed      # Executar seed
npm run db:studio    # Prisma Studio (UI do banco)
```

## Database Schema

Documentação completa: [docs/features/database.md](docs/features/database.md)

## Licença

Privado - Todos os direitos reservados.
