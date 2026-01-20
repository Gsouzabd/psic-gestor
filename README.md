# Gestor - Monorepo

Sistema de gestão de atendimentos para psicólogos e esteticistas, desenvolvido como monorepo com React, Vite, TypeScript e Supabase.

## 🏗️ Arquitetura

Este projeto é um **monorepo** gerenciado com **pnpm workspaces**, contendo:

- **`apps/psicgestor`**: Aplicação para psicólogos
- **`apps/esteticgestor`**: Aplicação para esteticistas
- **`packages/core`**: Pacote compartilhado (`@gestor/core`) com componentes, utilitários e serviços comuns

### Pacote Compartilhado (`@gestor/core`)

O pacote `@gestor/core` contém:
- **Componentes UI genéricos**: Modal, Calendar, SessionCard, PatientCard, FileUpload, ImageUpload, NotificationBadge, RecurrenceOptions, RecurrenceActionModal
- **Contextos**: AuthContext, ToastContext, NotificationContext
- **Hooks**: useDomainDetection
- **Utilitários**: CEP service, recurrence utils, sessoesAgendadas utils
- **Serviços**: WhatsApp service, notification service
- **Configuração**: Supabase client

Cada aplicação (`psicgestor` e `esteticgestor`) possui seus próprios componentes específicos e design system, compartilhando apenas a lógica e componentes genéricos através do `@gestor/core`.

## 🚀 Funcionalidades

### Psic Gestor
- **Autenticação**: Sistema completo de login e cadastro para psicólogos
- **Dashboard**: Visão geral com estatísticas e calendário de sessões
- **Gestão de Pacientes**: Cadastro e gerenciamento completo de pacientes
- **Anamnese**: Formulário detalhado com dados pessoais, histórico e upload de contratos
- **Prontuário**: Registro de sessões com anotações e controle de comparecimento
- **Pagamentos**: Controle financeiro com valores, descontos e status de pagamento
- **WhatsApp**: Integração com Evolution API para notificações

### Estetic Gestor
- Funcionalidades específicas para esteticistas (em desenvolvimento)
- Avaliações corporais, faciais e capilares
- Prontuários estéticos

## 🎨 Design Systems

### Psic Gestor
- Cores: `#415347` (primary), `#5f5c44` (secondary), `#f6f2e5` (background)
- Sistema: Psicólogo

### Estetic Gestor
- Cores: `#009c67` (primary)
- Sistema: Esteticista

## 🛠️ Tecnologias

- **Monorepo**: pnpm workspaces
- **Frontend**: React 18 + Vite + TypeScript
- **Backend/Banco**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Estilização**: TailwindCSS com CSS custom properties para theming
- **Roteamento**: React Router DOM
- **Datas**: date-fns
- **Ícones**: Lucide React
- **WhatsApp**: Evolution API

## 📦 Instalação

### Pré-requisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Passos

1. Clone o repositório:
```bash
git clone <repository-url>
cd psic-gestor
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente criando arquivos `.env` em cada aplicação:

**`apps/psicgestor/.env`**:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

**`apps/esteticgestor/.env`**:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. As migrations do banco de dados já foram aplicadas via MCP Supabase. As seguintes tabelas foram criadas:
   - `profiles` - Perfis dos profissionais
   - `pacientes` - Dados dos pacientes
   - `anamneses` - Anamneses dos pacientes (psicólogos)
   - `prontuarios` - Registros de sessões
   - `pagamentos` - Controle de pagamentos
   - `sessoes_agendadas` - Sessões agendadas
   - `recorrencias` - Recorrências de agendamentos
   - `whatsapp_instances` - Instâncias WhatsApp
   - `system_config` - Configurações do sistema

## 🚀 Desenvolvimento

### Executar aplicações em modo desenvolvimento

**Psic Gestor:**
```bash
pnpm dev:psic
```
Acesse: `http://localhost:5173` (ou a porta configurada no Vite)

**Estetic Gestor:**
```bash
pnpm dev:estetic
```
Acesse: `http://localhost:5174` (ou a porta configurada no Vite)

**Ambas simultaneamente:**
```bash
pnpm dev:psic & pnpm dev:estetic
```

### Build

**Build do pacote core:**
```bash
pnpm build:core
```

**Build do Psic Gestor:**
```bash
pnpm build:psic
```

**Build do Estetic Gestor:**
```bash
pnpm build:estetic
```

**Build de todas as aplicações:**
```bash
pnpm build
```

### Preview (produção local)

**Psic Gestor:**
```bash
pnpm preview:psic
```

**Estetic Gestor:**
```bash
pnpm preview:estetic
```

### Outros comandos

**Lint:**
```bash
pnpm lint
```

**Limpar node_modules e dist:**
```bash
pnpm clean
```

## 🔐 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Cada profissional vê apenas seus próprios pacientes
- Autenticação via Supabase Auth
- Upload seguro de arquivos no Supabase Storage
- Metadata `from_app` na tabela `user` para identificar a aplicação de origem

## 📱 Uso

### Psic Gestor

1. **Cadastro/Login**: Crie uma conta ou entre com suas credenciais
2. **Dashboard**: Veja estatísticas e navegue pelo calendário de sessões
3. **Adicionar Paciente**: Clique em "Novo Paciente" e preencha os dados
4. **Anamnese**: Complete a ficha de anamnese com dados pessoais e histórico
5. **Prontuário**: Registre sessões com data, hora, comparecimento e anotações
6. **Pagamentos**: Acompanhe valores recebidos e pendentes
7. **WhatsApp**: Configure e conecte sua instância WhatsApp para notificações

### Estetic Gestor

(Em desenvolvimento)

## 🏗️ Estrutura do Projeto

```
psic-gestor/
├── apps/
│   ├── psicgestor/          # Aplicação para psicólogos
│   │   ├── src/
│   │   │   ├── components/  # Componentes específicos (Tabs, Layout, ThemeProvider)
│   │   │   ├── pages/       # Páginas da aplicação
│   │   │   ├── config/      # Configurações (theme.ts)
│   │   │   └── App.tsx      # Componente principal
│   │   ├── public/          # Arquivos estáticos
│   │   ├── package.json     # Dependências da aplicação
│   │   └── vite.config.ts   # Configuração Vite
│   │
│   └── esteticgestor/       # Aplicação para esteticistas
│       ├── src/
│       │   ├── components/  # Componentes específicos
│       │   ├── pages/       # Páginas da aplicação
│       │   ├── config/      # Configurações
│       │   └── App.tsx      # Componente principal
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   └── core/                # Pacote compartilhado @gestor/core
│       ├── src/
│       │   ├── components/  # Componentes UI genéricos
│       │   ├── contexts/    # Contextos React (Auth, Toast, Notifications)
│       │   ├── hooks/       # Hooks compartilhados
│       │   ├── lib/         # Configuração Supabase
│       │   ├── services/    # Serviços (WhatsApp, Notifications)
│       │   ├── types/       # Tipos TypeScript
│       │   ├── utils/       # Utilitários (CEP, Recurrence, etc.)
│       │   └── index.ts     # Barrel exports
│       └── package.json
│
├── pnpm-workspace.yaml      # Configuração do workspace
├── tsconfig.base.json       # Configuração TypeScript base
├── package.json             # Root package.json
└── README.md
```

## 📝 Notas de Desenvolvimento

- O projeto utiliza **TypeScript** em todas as aplicações e pacotes
- Componentes específicos de cada aplicação (como Tabs) não são compartilhados
- Apenas componentes genéricos e lógica de negócio são compartilhados via `@gestor/core`
- Cada aplicação possui seu próprio design system e tema
- O metadata `from_app` no Supabase é usado para identificar a aplicação de origem do usuário

## 📝 Licença

Projeto desenvolvido para fins educacionais e profissionais.
