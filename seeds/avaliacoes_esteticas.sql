-- Seeds para Avaliações Estéticas
-- Psicólogo ID: 63c6b8cd-62ab-4898-87d9-9b8f310dd3b2

-- IDs dos pacientes
-- f7b44c01-1671-4575-8444-0200395bd3ea - Maria Silva Santos
-- b0902fb5-2263-4a68-9fdb-4a74ffb12229 - João Pedro Oliveira
-- 98733da0-9b13-42b3-8b95-4377f0c2a529 - Ana Paula Mendes
-- fd05b64e-0e3d-42ec-aea5-4f5fb8b1d669 - Carlos Eduardo Lima
-- 2fae2497-6b71-4f7e-9ebc-0f7d31ee98c0 - Juliana Costa Rocha

-- ============================================
-- AVALIAÇÃO GERAL
-- ============================================

-- Maria Silva Santos
INSERT INTO avaliacao_geral (paciente_id, queixa, duracao, habitos_diarios, tratamento_estetico_anterior, tratamento_estetico_anterior_qual, usa_lentes_contato, utilizacao_cosmeticos, utilizacao_cosmeticos_qual, exposicao_sol, filtro_solar, filtro_solar_frequencia, tabagismo, ingere_bebida_alcoolica, ingere_bebida_alcoolica_frequencia, funcionamento_intestinal, qualidade_sono, qualidade_sono_horas, ingestao_agua, tipo_alimentacao, pratica_atividade_fisica, pratica_atividade_fisica_tipo, pratica_atividade_fisica_frequencia, uso_anticoncepcional, uso_anticoncepcional_qual, data_ultima_menstruacao, gestante, gestacoes, gestacoes_quantidade, historico_clinico, tratamento_medico_atual, tratamento_medico_atual_medicamentos, alergias, alergias_quais, hipo_hipertensao, disturbio_circulatorio, data_ultimo_checkup)
VALUES (
  'f7b44c01-1671-4575-8444-0200395bd3ea',
  'Flacidez facial e corporal, celulite nas coxas',
  'Aproximadamente 2 anos',
  'Trabalha sentada por longas horas, pouca atividade física',
  true,
  'Limpeza de pele mensal, drenagem linfática',
  false,
  true,
  'Base, protetor solar, hidratante facial',
  true,
  true,
  'Diariamente',
  false,
  true,
  'Socialmente, 1-2 vezes por semana',
  'Regular',
  'Boa',
  '7-8 horas',
  '2 litros',
  'Equilibrada',
  true,
  'Caminhada e pilates',
  '3 vezes por semana',
  true,
  'Pílula anticoncepcional',
  '2024-01-15',
  false,
  true,
  '2 gestações',
  'Hipertensão controlada',
  true,
  'Losartana 50mg',
  true,
  'Níquel',
  true,
  false,
  '2023-12-01'
);

-- Ana Paula Mendes
INSERT INTO avaliacao_geral (paciente_id, queixa, duracao, habitos_diarios, tratamento_estetico_anterior, tratamento_estetico_anterior_qual, usa_lentes_contato, utilizacao_cosmeticos, utilizacao_cosmeticos_qual, exposicao_sol, filtro_solar, filtro_solar_frequencia, tabagismo, ingere_bebida_alcoolica, funcionamento_intestinal, qualidade_sono, qualidade_sono_horas, ingestao_agua, tipo_alimentacao, pratica_atividade_fisica, pratica_atividade_fisica_tipo, pratica_atividade_fisica_frequencia, uso_anticoncepcional, data_ultima_menstruacao, gestante, historico_clinico, alergias, data_ultimo_checkup)
VALUES (
  '98733da0-9b13-42b3-8b95-4377f0c2a529',
  'Acne, oleosidade excessiva, manchas na face',
  'Desde a adolescência, piorou nos últimos 6 meses',
  'Estudante, rotina irregular',
  false,
  NULL,
  false,
  true,
  'Sabonete facial, tônico, hidratante',
  true,
  true,
  'Diariamente',
  false,
  false,
  'Irregular',
  'Regular',
  '6-7 horas',
  '1.5 litros',
  'Vegetariana',
  false,
  NULL,
  NULL,
  false,
  '2024-01-20',
  false,
  'Sem histórico relevante',
  false,
  NULL,
  '2023-11-15'
);

-- Juliana Costa Rocha
INSERT INTO avaliacao_geral (paciente_id, queixa, duracao, habitos_diarios, tratamento_estetico_anterior, tratamento_estetico_anterior_qual, usa_lentes_contato, utilizacao_cosmeticos, utilizacao_cosmeticos_qual, exposicao_sol, filtro_solar, filtro_solar_frequencia, tabagismo, ingere_bebida_alcoolica, ingere_bebida_alcoolica_frequencia, funcionamento_intestinal, qualidade_sono, qualidade_sono_horas, ingestao_agua, tipo_alimentacao, pratica_atividade_fisica, pratica_atividade_fisica_tipo, pratica_atividade_fisica_frequencia, uso_anticoncepcional, data_ultima_menstruacao, gestante, gestacoes, gestacoes_quantidade, historico_clinico, alergias, data_ultimo_checkup)
VALUES (
  '2fae2497-6b71-4f7e-9ebc-0f7d31ee98c0',
  'Queda de cabelo, fios quebradiços',
  '8 meses',
  'Profissional estressante, poucas horas de sono',
  true,
  'Tratamento capilar com queratina',
  false,
  true,
  'Shampoo, condicionador, máscara capilar',
  false,
  false,
  NULL,
  false,
  true,
  'Ocasionalmente',
  'Constipação',
  'Ruim',
  '5-6 horas',
  '1 litro',
  'Irregular, muitos fast foods',
  false,
  NULL,
  NULL,
  false,
  '2024-01-10',
  false,
  true,
  '1 gestação',
  'Ansiedade, uso de antidepressivos',
  false,
  NULL,
  '2023-10-20'
);

-- ============================================
-- AVALIAÇÃO CORPORAL
-- ============================================

-- Maria Silva Santos
INSERT INTO avaliacao_corporal (paciente_id, queixa_principal, feg_tipo, feg_grau, feg_localizacao, feg_coloracao_tecido, feg_temperatura, feg_dor_palpacao, feg_edema, feg_teste_cacifo, biotipo, peso, altura, imc, classificacao_imc, flacidez_tissular_grau, flacidez_muscular_grau, flacidez_tissular_localizacao, flacidez_muscular_localizacao, estrias_cor, estrias_tipo, estrias_regiao, alteracoes_vasculares_microvasos_telangiectasias, alteracoes_vasculares_microvasos_telangiectasias_local, perimetria_braco_d, perimetria_braco_e, perimetria_abdomen_superior, perimetria_abdomen_inferior, perimetria_cicatriz_umbilical, perimetria_quadril, perimetria_coxa_d, perimetria_coxa_e, perimetria_panturrilha_d, perimetria_panturrilha_e, proposta_tratamento)
VALUES (
  'f7b44c01-1671-4575-8444-0200395bd3ea',
  'Flacidez e celulite',
  'Edematosa',
  'Grau II',
  'Coxas e glúteos',
  'Normal',
  'Normal',
  false,
  'Leve',
  'Positivo',
  'Endomorfo',
  68.5,
  1.65,
  25.2,
  'Sobrepeso',
  'Moderada',
  'Leve',
  'Braços, abdômen, coxas',
  'Braços',
  'Brancas',
  'Atrofia',
  'Abdômen, coxas, glúteos',
  true,
  'Coxas',
  '28',
  '28',
  '88',
  '95',
  '92',
  '98',
  '58',
  '58',
  '36',
  '36',
  'Drenagem linfática, radiofrequência, exercícios localizados'
);

-- Ana Paula Mendes
INSERT INTO avaliacao_corporal (paciente_id, queixa_principal, biotipo, peso, altura, imc, classificacao_imc, flacidez_tissular_grau, flacidez_muscular_grau, estrias_cor, estrias_tipo, estrias_regiao, perimetria_braco_d, perimetria_braco_e, perimetria_abdomen_superior, perimetria_abdomen_inferior, perimetria_quadril, perimetria_coxa_d, perimetria_coxa_e, proposta_tratamento)
VALUES (
  '98733da0-9b13-42b3-8b95-4377f0c2a529',
  'Gordura localizada no abdômen',
  'Ectomorfo',
  55.0,
  1.70,
  19.0,
  'Normal',
  'Leve',
  'Leve',
  'Roxas',
  'Estrias recentes',
  'Coxas',
  '24',
  '24',
  '72',
  '78',
  '88',
  '52',
  '52',
  'Criolipólise, exercícios abdominais'
);

-- ============================================
-- AVALIAÇÃO FACIAL
-- ============================================

-- Maria Silva Santos
INSERT INTO avaliacao_facial (paciente_id, biotipo_cutaneo, estado_cutaneo, textura, espessura, ostios, acne_grau, involucao_cutanea_linhas, involucao_cutanea_sulcos, involucao_cutanea_rugas, involucao_cutanea_elastose_solar, fototipo_fitzpatrick, fotoenvelhecimento_glogau, observacoes, alteracoes_vasculares_telangiectasias, alteracoes_vasculares_eritema, alteracoes_vasculares_rosacea, olheiras, olheiras_tipo, flacidez, objetivos_tratamento, tratamento_proposto)
VALUES (
  'f7b44c01-1671-4575-8444-0200395bd3ea',
  'Misto',
  'Desidratado',
  'Irregular',
  'Fina',
  'Dilatados',
  'Grau I',
  'Leves ao redor dos olhos',
  'Nasolabiais',
  'Frontais e perioculares',
  'Leve',
  'III',
  'Grau II',
  'Pele sensível, necessita hidratação intensa',
  'Leves nas bochechas',
  'Leve',
  false,
  true,
  'Pigmentar',
  true,
  'Reduzir rugas, melhorar firmeza e hidratação',
  'Hidratação profunda, radiofrequência, preenchimento com ácido hialurônico'
);

-- Ana Paula Mendes
INSERT INTO avaliacao_facial (paciente_id, biotipo_cutaneo, estado_cutaneo, textura, espessura, ostios, acne_grau, fototipo_fitzpatrick, fotoenvelhecimento_glogau, observacoes, sistema_baumann_hipercromia_local, sistema_baumann_hipercromia_tipo, alteracoes_vasculares_eritema, olheiras, objetivos_tratamento, tratamento_proposto)
VALUES (
  '98733da0-9b13-42b3-8b95-4377f0c2a529',
  'Oleoso',
  'Oleoso com acne',
  'Áspera',
  'Espessa',
  'Muito dilatados',
  'Grau II',
  'IV',
  'Grau I',
  'Pele muito oleosa, poros dilatados, manchas pós-inflamatórias',
  'Bochechas e testa',
  'Melasma e manchas pós-inflamatórias',
  'Moderado',
  false,
  'Controlar oleosidade, reduzir acne e manchas',
  'Limpeza de pele, peeling químico, tratamento com ácido salicílico e retinóides'
);

-- Juliana Costa Rocha
INSERT INTO avaliacao_facial (paciente_id, biotipo_cutaneo, estado_cutaneo, textura, espessura, ostios, involucao_cutanea_linhas, involucao_cutanea_rugas, fototipo_fitzpatrick, fotoenvelhecimento_glogau, olheiras, olheiras_tipo, flacidez, observacoes_finais)
VALUES (
  '2fae2497-6b71-4f7e-9ebc-0f7d31ee98c0',
  'Sensível',
  'Desidratado',
  'Fina',
  'Fina',
  'Fechados',
  'Leves',
  'Leves',
  'II',
  'Grau I',
  true,
  'Vascular e pigmentar',
  true,
  'Melhorar hidratação, reduzir olheiras e sinais de cansaço. Tratamento: Hidratação intensa, tratamento para olheiras, vitamina C'
);

-- ============================================
-- AVALIAÇÃO CAPILAR
-- ============================================

-- Juliana Costa Rocha
INSERT INTO avaliacao_capilar (paciente_id, queixa_principal, problemas_saude, problemas_saude_quais, tempo_problema, evolucao, mudanca_fios, sintomas_couro_cabeludo, alergias, problemas_endocrinos, medicamentos, medicamentos_quais, frequencia_lavagem, produtos_utilizados, tipo, aspecto, comprimento, curvatura, densidade, porosidade, textura, elasticidade, cor, alteracoes, falhas, entradas, calvicie)
VALUES (
  '2fae2497-6b71-4f7e-9ebc-0f7d31ee98c0',
  'Queda excessiva e fios quebradiços',
  true,
  'Ansiedade, uso de antidepressivos',
  '8 meses',
  'Progressiva',
  'Fios mais finos e quebradiços',
  'Coceira leve, caspa',
  false,
  false,
  true,
  'Sertralina 50mg',
  'A cada 2 dias',
  'Shampoo anticaspa, condicionador',
  'Liso',
  'Opaco, sem brilho',
  'Longo (até os ombros)',
  'Liso',
  'Baixa',
  'Alta',
  'Fina',
  'Baixa',
  'Castanho escuro',
  'Pontas duplas, fios quebrados',
  'Leve na região frontal',
  'Leve',
  'Leve'
);

-- Ana Paula Mendes
INSERT INTO avaliacao_capilar (paciente_id, queixa_principal, tempo_problema, mudanca_fios, sintomas_couro_cabeludo, frequencia_lavagem, produtos_utilizados, tipo, aspecto, comprimento, curvatura, densidade, porosidade, textura, elasticidade, cor, alteracoes)
VALUES (
  '98733da0-9b13-42b3-8b95-4377f0c2a529',
  'Oleosidade excessiva, necessidade de lavar diariamente',
  'Desde sempre',
  'Fios oleosos na raiz, secos nas pontas',
  'Oleosidade excessiva',
  'Diariamente',
  'Shampoo para cabelos oleosos',
  'Ondulado',
  'Oleoso na raiz, seco nas pontas',
  'Médio (até o peito)',
  'Ondulado',
  'Média',
  'Média',
  'Média',
  'Boa',
  'Castanho claro',
  'Oleosidade excessiva, pontas ressecadas'
);

