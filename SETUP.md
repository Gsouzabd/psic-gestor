# Guia de Configuração - Psic Gestor

## Passo 1: Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Preencha os dados:
   - Nome do projeto: `psic-gestor` (ou nome de sua escolha)
   - Database Password: crie uma senha forte
   - Região: escolha a mais próxima do Brasil

## Passo 2: Obter Credenciais

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon/public key** (chave pública)

## Passo 3: Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto
2. Adicione as seguintes linhas com suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

## Passo 4: Migrations do Banco de Dados

✅ **As migrations já foram aplicadas automaticamente via MCP Supabase!**

As seguintes tabelas foram criadas:
- `profiles` - Perfis dos psicólogos
- `pacientes` - Dados dos pacientes  
- `anamneses` - Fichas de anamnese
- `prontuarios` - Registros de sessões
- `pagamentos` - Controle financeiro

Além disso, foi criado:
- Bucket `contratos` no Supabase Storage para upload de arquivos
- Políticas RLS (Row Level Security) em todas as tabelas
- Índices para otimização de consultas

## Passo 5: Verificar Storage

1. No Supabase, vá em **Storage**
2. Verifique se o bucket `contratos` foi criado
3. Se não existir, crie manualmente:
   - Nome: `contratos`
   - Public: deixe desmarcado (privado)

## Passo 6: Iniciar o Projeto

```bash
npm run dev
```

O projeto estará rodando em: `http://localhost:5173`

## Passo 7: Primeiro Acesso

1. Acesse `http://localhost:5173`
2. Clique em "Cadastre-se"
3. Preencha seus dados:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
4. Faça login com suas credenciais
5. Pronto! Você já pode começar a usar o sistema

## 🎯 Próximos Passos

- **Adicionar Paciente**: Clique em "Novo Paciente" no Dashboard
- **Preencher Anamnese**: Complete os dados na aba Anamnese
- **Registrar Sessão**: Use a aba Prontuário para registrar suas sessões
- **Controlar Pagamentos**: Acompanhe valores na aba Pagamentos

## 🐛 Problemas Comuns

### Erro ao conectar com Supabase
- Verifique se as credenciais no `.env` estão corretas
- Certifique-se de que o arquivo `.env` está na raiz do projeto
- Reinicie o servidor de desenvolvimento

### Erro 403 ao fazer upload
- Verifique se o bucket `contratos` existe
- Confirme se as políticas de Storage foram criadas corretamente

### Não consigo ver os pacientes de outro psicólogo
- Isso é esperado! O RLS garante que cada psicólogo veja apenas seus próprios dados

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Console do navegador (F12) para erros JavaScript
2. Network tab para erros de API
3. Logs do Supabase (Dashboard → Logs)


