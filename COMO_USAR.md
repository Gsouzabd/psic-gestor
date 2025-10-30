# 📖 Como Usar o Psic Gestor

## 🚀 Iniciando o Sistema

Após seguir os passos de configuração do `SETUP.md`, execute:

```bash
npm run dev
```

Acesse: `http://localhost:5173`

---

## 1️⃣ Primeiro Acesso

### Criar Conta
1. Na tela inicial, clique em **"Cadastre-se"**
2. Preencha:
   - **Nome Completo**: Seu nome profissional
   - **Email**: Seu email profissional
   - **Senha**: Mínimo 6 caracteres
   - **Confirmar Senha**: Digite novamente
3. Clique em **"Criar Conta"**
4. Você será redirecionado para o login

### Fazer Login
1. Digite seu **email** e **senha**
2. Clique em **"Entrar"**
3. Você será direcionado ao Dashboard

---

## 2️⃣ Dashboard

O Dashboard é sua tela inicial e mostra:

### Cards de Estatísticas
- **Total de Pacientes**: Quantos pacientes você tem cadastrados
- **Sessões da Semana**: Sessões agendadas/realizadas esta semana
- **Pagamentos Pendentes**: Valor total em aberto
- **Últimas Sessões**: Últimos 5 atendimentos registrados

### Calendário de Sessões
- Visualize todas as sessões do mês
- **Verde**: Paciente compareceu
- **Amarelo**: Paciente faltou
- **Clique em uma sessão**: Ver detalhes em modal
- **Navegação**: Use as setas para mudar de mês

### Ações Rápidas
- **Novo Paciente**: Botão no canto superior direito

---

## 3️⃣ Gestão de Pacientes

### Listar Pacientes
1. Clique em **"Pacientes"** no menu lateral
2. Veja todos os pacientes em cards
3. Use a **barra de busca** para encontrar por:
   - Nome
   - Email
   - Telefone

### Adicionar Novo Paciente
1. Clique em **"Novo Paciente"**
2. Preencha os dados básicos:
   - **Nome Completo** (obrigatório)
   - Idade
   - Data de Nascimento
   - Gênero
   - Telefone
   - Email
   - Endereço
   - Profissão
   - Escolaridade
   - **Valor por Sessão**: Valor padrão que será usado
3. Clique em **"Criar Paciente"**
4. Você será direcionado para os detalhes do paciente

### Acessar Detalhes
- Clique em qualquer **card de paciente**
- Você verá 3 abas: **Anamnese**, **Prontuário** e **Pagamentos**

---

## 4️⃣ Aba Anamnese

Complete a ficha de anamnese do paciente:

### 👨‍👩‍👧 Identificação dos Pais
- Nome, idade, profissão e telefone do pai
- Nome, idade, profissão e telefone da mãe
- Endereço dos pais

### 🕒 Atendimento
- **Frequência**: Ex: Semanal, Quinzenal
- **Data/Hora padrão**: Horário habitual das sessões

### 💬 Queixa Principal
- Campo de texto livre para descrever a queixa do paciente
- Use para registrar o motivo da busca por atendimento

### 📜 Histórico
- ✅ **Já realizou psicoterapia antes?**
  - Se sim, aparecer campo para registrar por quanto tempo
- ✅ **Possui acompanhamento psiquiátrico?**
  - Se sim, aparecer campo para medicação atual

### 📄 Contrato
- **Upload de arquivo**: Clique na área tracejada
- Formatos aceitos: PDF, JPG, PNG (max 5MB)
- Após upload: botões para download ou excluir
- Arquivo fica armazenado de forma segura no Supabase Storage

### Salvar
- Clique em **"Salvar Anamnese"** no final da página
- Mensagem de sucesso aparecerá

---

## 5️⃣ Aba Prontuário

Registre todas as sessões realizadas:

### Visualizar Sessões
- Sessões aparecem em **ordem cronológica** (mais recente primeiro)
- Cada card mostra:
  - **Data e Hora** da sessão
  - **Badge verde**: Paciente compareceu
  - **Badge vermelho**: Paciente faltou
  - **Preview das anotações**: Primeiras linhas
- **Clique no card**: Expande para ver anotações completas

### Registrar Nova Sessão
1. Clique em **"Nova Sessão"**
2. Preencha no modal:
   - **Data** (obrigatório)
   - **Hora** (obrigatório)
   - **Compareceu?**: Sim ou Não
   - **Anotações**: Campo livre para suas observações
   
3. **Informações de Pagamento**:
   - **Valor da Sessão**: Pré-preenchido com valor do paciente
   - **Desconto**: Opcional (R$)
   - **Valor Final**: Calculado automaticamente

4. Clique em **"Registrar Sessão"**

### Importante! 🔗
Ao criar uma sessão, um **pagamento é criado automaticamente** e vinculado a ela!

### Excluir Sessão
1. Clique em uma sessão para expandir
2. Clique em **"Excluir Sessão"** (botão vermelho)
3. Confirme a exclusão
4. ⚠️ O pagamento vinculado também será excluído

---

## 6️⃣ Aba Pagamentos

Controle financeiro completo:

### 📊 Resumo Financeiro
Cards coloridos mostram:
- **Total de Sessões** (azul): Quantidade total
- **Total a Receber** (roxo): Soma de todos os valores
- **Total Recebido** (verde): Valores já pagos
- **Saldo em Aberto** (amarelo): Diferença entre receber e recebido

### 🔍 Filtros
- **Todos**: Mostra todos os pagamentos
- **Pagos**: Apenas pagamentos já recebidos
- **Pendentes**: Apenas valores em aberto

### 📋 Tabela de Pagamentos
Colunas:
- **Data**: Data da sessão
- **Compareceu**: Ícone verde (sim) ou vermelho (não)
- **Valor**: Valor base da sessão
- **Desconto**: Desconto aplicado (se houver)
- **Valor Final**: Valor - Desconto
- **Status**: Badge "Pago" (verde) ou "Pendente" (amarelo)
- **Ações**: Botão para alterar status

### Marcar como Pago/Pendente
1. Localize o pagamento na tabela
2. Clique em **"Marcar como Pago"** (se pendente)
3. Ou **"Marcar Pendente"** (se pago)
4. O status muda instantaneamente
5. Os cards de resumo atualizam automaticamente

---

## 7️⃣ Menu Lateral

### 📍 Navegação
- **Dashboard**: Visão geral e calendário
- **Pacientes**: Lista e gestão de pacientes

### 👤 Perfil
- Seu nome aparece no topo do menu
- Mostra qual psicólogo está logado

### 🚪 Sair
- Clique em **"Sair"** no final do menu
- Você será desconectado e voltará para o login

---

## 💡 Dicas de Uso

### Fluxo Recomendado
1. **Cadastrar Paciente** → Dados básicos
2. **Preencher Anamnese** → Histórico completo
3. **Registrar Sessões** → Após cada atendimento
4. **Controlar Pagamentos** → Marcar quando receber

### Boas Práticas
- ✅ Preencha a anamnese logo no primeiro atendimento
- ✅ Registre sessões logo após realizá-las
- ✅ Use o campo de anotações para insights importantes
- ✅ Marque pagamentos como "Pago" ao receber
- ✅ Faça upload do contrato assinado
- ✅ Use o calendário para ter visão mensal

### Segurança
- 🔒 Cada psicólogo vê apenas seus próprios pacientes
- 🔒 Dados protegidos por Row Level Security
- 🔒 Autenticação segura via Supabase
- 🔒 Arquivos armazenados de forma privada

### Atalhos
- **Dashboard → Novo Paciente**: Botão verde no canto
- **Últimas Sessões → Paciente**: Clique para ir direto ao prontuário
- **Calendário → Sessão**: Clique para ver detalhes

---

## 🆘 Solução de Problemas

### Não consigo fazer login
- Verifique se email e senha estão corretos
- Senha deve ter mínimo 6 caracteres
- Certifique-se de ter criado uma conta

### Erro ao criar paciente
- Nome completo é obrigatório
- Verifique conexão com internet
- Veja o console do navegador (F12) para erros

### Upload de contrato falha
- Arquivo deve ser PDF, JPG ou PNG
- Tamanho máximo: 5MB
- Verifique se bucket "contratos" existe no Supabase

### Pagamentos não aparecem
- Pagamentos são criados automaticamente ao registrar sessão
- Não há como criar pagamento manualmente
- Sempre crie sessão no Prontuário primeiro

### Calendário vazio
- Registre sessões no Prontuário
- Verifique se as datas estão corretas
- Navegue entre os meses usando as setas

---

## 📞 Suporte Técnico

Para problemas técnicos:
1. Verifique o console (F12 → Console)
2. Verifique a aba Network (F12 → Network)
3. Veja os logs do Supabase (Dashboard → Logs)

---

## 🎉 Aproveite!

O Psic Gestor foi desenvolvido para facilitar sua rotina profissional.
Explore todas as funcionalidades e organize seus atendimentos! 💚


