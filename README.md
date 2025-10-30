# Psic Gestor

Sistema de gestão de atendimentos para psicólogos, desenvolvido com React, Vite e Supabase.

## 🚀 Funcionalidades

- **Autenticação**: Sistema completo de login e cadastro para psicólogos
- **Dashboard**: Visão geral com estatísticas e calendário de sessões
- **Gestão de Pacientes**: Cadastro e gerenciamento completo de pacientes
- **Anamnese**: Formulário detalhado com dados pessoais, histórico e upload de contratos
- **Prontuário**: Registro de sessões com anotações e controle de comparecimento
- **Pagamentos**: Controle financeiro com valores, descontos e status de pagamento

## 🎨 Design

- Cores da marca: `#415347` (primary), `#5f5c44` (secondary), `#f6f2e5` (background)
- Interface moderna e responsiva
- Componentes com animações suaves

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **Backend/Banco**: Supabase (PostgreSQL + Auth + Storage)
- **Estilização**: TailwindCSS
- **Roteamento**: React Router DOM
- **Datas**: date-fns
- **Ícones**: Lucide React

## 📦 Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. As migrations do banco de dados já foram aplicadas via MCP Supabase. As seguintes tabelas foram criadas:
   - `profiles` - Perfis dos psicólogos
   - `pacientes` - Dados dos pacientes
   - `anamneses` - Anamneses dos pacientes
   - `prontuarios` - Registros de sessões
   - `pagamentos` - Controle de pagamentos

5. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## 🔐 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Cada psicólogo vê apenas seus próprios pacientes
- Autenticação via Supabase Auth
- Upload seguro de arquivos no Supabase Storage

## 📱 Uso

1. **Cadastro/Login**: Crie uma conta ou entre com suas credenciais
2. **Dashboard**: Veja estatísticas e navegue pelo calendário de sessões
3. **Adicionar Paciente**: Clique em "Novo Paciente" e preencha os dados
4. **Anamnese**: Complete a ficha de anamnese com dados pessoais e histórico
5. **Prontuário**: Registre sessões com data, hora, comparecimento e anotações
6. **Pagamentos**: Acompanhe valores recebidos e pendentes

## 🏗️ Estrutura do Projeto

```
psic-gestor/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # Contextos React (Auth)
│   ├── lib/            # Configuração Supabase
│   ├── pages/          # Páginas da aplicação
│   ├── App.jsx         # Componente principal
│   └── main.jsx        # Ponto de entrada
├── public/             # Arquivos estáticos
└── package.json        # Dependências
```

## 📝 Licença

Projeto desenvolvido para fins educacionais e profissionais.


