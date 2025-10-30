-- ============================================
-- SEEDS PARA PSIC GESTOR
-- ============================================
-- INSTRUÇÕES:
-- 1. Primeiro, crie a conta no sistema acessando http://localhost:5173/register
--    Email: mariajulianavieira.psi@gmail.com
--    Senha: Acessopsi22*
-- 2. Faça login no sistema
-- 3. No Supabase Dashboard, vá em SQL Editor
-- 4. Cole e execute este script
-- ============================================

-- Obter o ID do usuário logado (será usado em todos os inserts)
-- Substitua 'mariajulianavieira.psi@gmail.com' pelo email do usuário criado
DO $$
DECLARE
  v_user_id UUID;
  v_paciente_ids UUID[];
  v_prontuario_ids UUID[];
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'mariajulianavieira.psi@gmail.com';

  -- Se não encontrar, usar o primeiro usuário disponível
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado. Crie uma conta primeiro!';
  END IF;

  RAISE NOTICE 'Usando user_id: %', v_user_id;

  -- ============================================
  -- INSERIR PACIENTES
  -- ============================================
  INSERT INTO pacientes (id, psicologo_id, nome_completo, idade, data_nascimento, genero, endereco, profissao, escolaridade, telefone, email, valor_sessao, created_at)
  VALUES 
    (gen_random_uuid(), v_user_id, 'João Silva Santos', 28, '1995-03-15', 'Masculino', 'Rua das Flores, 123, São Paulo - SP', 'Engenheiro de Software', 'Superior Completo', '(11) 98765-4321', 'joao.silva@email.com', 150.00, NOW() - INTERVAL '60 days'),
    (gen_random_uuid(), v_user_id, 'Ana Paula Oliveira', 35, '1988-07-22', 'Feminino', 'Av. Paulista, 1000, São Paulo - SP', 'Advogada', 'Superior Completo', '(11) 97654-3210', 'ana.oliveira@email.com', 180.00, NOW() - INTERVAL '55 days'),
    (gen_random_uuid(), v_user_id, 'Carlos Eduardo Mendes', 42, '1981-11-08', 'Masculino', 'Rua Augusta, 456, São Paulo - SP', 'Empresário', 'Superior Completo', '(11) 96543-2109', 'carlos.mendes@email.com', 200.00, NOW() - INTERVAL '50 days'),
    (gen_random_uuid(), v_user_id, 'Mariana Costa Lima', 31, '1992-05-30', 'Feminino', 'Rua Oscar Freire, 789, São Paulo - SP', 'Designer Gráfica', 'Superior Completo', '(11) 95432-1098', 'mariana.lima@email.com', 150.00, NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), v_user_id, 'Pedro Henrique Rocha', 25, '1998-09-12', 'Masculino', 'Rua Consolação, 321, São Paulo - SP', 'Estudante', 'Superior Incompleto', '(11) 94321-0987', 'pedro.rocha@email.com', 120.00, NOW() - INTERVAL '40 days'),
    (gen_random_uuid(), v_user_id, 'Juliana Ferreira Santos', 29, '1994-01-25', 'Feminino', 'Alameda Santos, 654, São Paulo - SP', 'Jornalista', 'Superior Completo', '(11) 93210-9876', 'juliana.ferreira@email.com', 160.00, NOW() - INTERVAL '35 days'),
    (gen_random_uuid(), v_user_id, 'Ricardo Alves Pereira', 38, '1985-06-18', 'Masculino', 'Rua Haddock Lobo, 987, São Paulo - SP', 'Médico', 'Superior Completo', '(11) 92109-8765', 'ricardo.pereira@email.com', 220.00, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), v_user_id, 'Fernanda Souza Martins', 27, '1996-12-03', 'Feminino', 'Rua Bela Cintra, 258, São Paulo - SP', 'Professora', 'Superior Completo', '(11) 91098-7654', 'fernanda.martins@email.com', 140.00, NOW() - INTERVAL '25 days'),
    (gen_random_uuid(), v_user_id, 'Gabriel Rodrigues Lima', 33, '1990-04-20', 'Masculino', 'Av. Rebouças, 741, São Paulo - SP', 'Arquiteto', 'Superior Completo', '(11) 90987-6543', 'gabriel.lima@email.com', 170.00, NOW() - INTERVAL '20 days'),
    (gen_random_uuid(), v_user_id, 'Beatriz Santos Almeida', 30, '1993-08-14', 'Feminino', 'Rua Estados Unidos, 852, São Paulo - SP', 'Psicóloga', 'Superior Completo', '(11) 89876-5432', 'beatriz.almeida@email.com', 180.00, NOW() - INTERVAL '15 days')
  RETURNING id INTO v_paciente_ids;

  RAISE NOTICE 'Pacientes criados: %', array_length(v_paciente_ids, 1);

  -- ============================================
  -- INSERIR ANAMNESES (uma para cada paciente)
  -- ============================================
  INSERT INTO anamneses (paciente_id, nome_pai, idade_pai, profissao_pai, telefone_pai, nome_mae, idade_mae, profissao_mae, telefone_mae, endereco_pais, frequencia_atendimento, queixa_principal, psicoterapia_anterior, tempo_psicoterapia, acompanhamento_psiquiatrico, medicacao_atual)
  SELECT 
    id as paciente_id,
    'José ' || split_part(nome_completo, ' ', 2) as nome_pai,
    60 as idade_pai,
    'Aposentado' as profissao_pai,
    '(11) 99999-0001' as telefone_pai,
    'Maria ' || split_part(nome_completo, ' ', 2) as nome_mae,
    58 as idade_mae,
    'Do lar' as profissao_mae,
    '(11) 99999-0002' as telefone_mae,
    'Rua Principal, 100, São Paulo - SP' as endereco_pais,
    'Semanal' as frequencia_atendimento,
    'Paciente relata ansiedade e dificuldades no trabalho. Busca autoconhecimento e estratégias para lidar com o estresse do dia a dia.' as queixa_principal,
    (random() > 0.5) as psicoterapia_anterior,
    CASE WHEN random() > 0.5 THEN '6 meses' ELSE NULL END as tempo_psicoterapia,
    (random() > 0.7) as acompanhamento_psiquiatrico,
    CASE WHEN random() > 0.7 THEN 'Sertralina 50mg' ELSE NULL END as medicacao_atual
  FROM pacientes 
  WHERE psicologo_id = v_user_id;

  RAISE NOTICE 'Anamneses criadas';

  -- ============================================
  -- INSERIR PRONTUÁRIOS (múltiplas sessões)
  -- ============================================
  -- Criar 5 sessões para cada paciente
  WITH paciente_list AS (
    SELECT id, valor_sessao, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM pacientes 
    WHERE psicologo_id = v_user_id
  ),
  sessao_dates AS (
    SELECT 
      pl.id as paciente_id,
      pl.valor_sessao,
      (NOW() - (pl.rn * 7 + s.n * 7) * INTERVAL '1 day')::date as data_sessao,
      '14:00:00'::time as hora_sessao,
      s.n as sessao_num
    FROM paciente_list pl
    CROSS JOIN generate_series(1, 5) as s(n)
  )
  INSERT INTO prontuarios (id, paciente_id, data, hora, compareceu, anotacoes, created_at)
  SELECT 
    gen_random_uuid(),
    paciente_id,
    data_sessao,
    hora_sessao,
    (random() > 0.2), -- 80% de comparecimento
    'Sessão ' || sessao_num || ': Paciente apresentou boa evolução. ' ||
    CASE 
      WHEN sessao_num = 1 THEN 'Primeira sessão focada em estabelecer vínculo terapêutico e compreender a demanda.'
      WHEN sessao_num = 2 THEN 'Exploração mais profunda das questões trazidas. Paciente demonstrou abertura.'
      WHEN sessao_num = 3 THEN 'Trabalhamos estratégias de enfrentamento. Paciente relatou melhora nos sintomas.'
      WHEN sessao_num = 4 THEN 'Continuidade do processo. Paciente trouxe sonhos para análise.'
      ELSE 'Fechamento do ciclo mensal. Paciente demonstra avanços significativos.'
    END,
    data_sessao
  FROM sessao_dates
  RETURNING id INTO v_prontuario_ids;

  RAISE NOTICE 'Prontuários criados: %', array_length(v_prontuario_ids, 1);

  -- ============================================
  -- INSERIR PAGAMENTOS (vinculados aos prontuários)
  -- ============================================
  INSERT INTO pagamentos (prontuario_id, paciente_id, data, valor_sessao, desconto, pago, compareceu)
  SELECT 
    p.id as prontuario_id,
    p.paciente_id,
    p.data,
    pac.valor_sessao,
    CASE 
      WHEN random() > 0.8 THEN (pac.valor_sessao * 0.1)::decimal(10,2) -- 10% de desconto em 20% dos casos
      ELSE 0
    END as desconto,
    (random() > 0.3) as pago, -- 70% pagos
    p.compareceu
  FROM prontuarios p
  JOIN pacientes pac ON pac.id = p.paciente_id
  WHERE pac.psicologo_id = v_user_id;

  RAISE NOTICE 'Pagamentos criados';

  RAISE NOTICE '==================================================';
  RAISE NOTICE 'SEEDS CRIADOS COM SUCESSO!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE '10 Pacientes criados';
  RAISE NOTICE '10 Anamneses criadas';
  RAISE NOTICE '50 Sessões criadas (5 por paciente)';
  RAISE NOTICE '50 Pagamentos criados';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Agora você pode fazer login e explorar o sistema!';
  RAISE NOTICE 'Email: mariajulianavieira.psi@gmail.com';
  RAISE NOTICE '==================================================';

END $$;

