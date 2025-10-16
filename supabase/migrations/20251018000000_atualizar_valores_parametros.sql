-- Atualização dos valores para Membros
UPDATE parametros_cargo
SET 
  base_mensal = 41845.48,
  aliquota_patronal = 0.28,
  auxilio_saude = 4184.55,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = true
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'Procurador de Justiça';

UPDATE parametros_cargo
SET 
  base_mensal = 39753.21,
  aliquota_patronal = 0.28,
  auxilio_saude = 3975.32,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = true
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'Promotor de Justiça' AND
  cargos.classe = 'Final';

UPDATE parametros_cargo
SET 
  base_mensal = 37765.55,
  aliquota_patronal = 0.28,
  auxilio_saude = 3776.56,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = true
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'Promotor de Justiça' AND
  cargos.classe = 'Intermediária';

UPDATE parametros_cargo
SET 
  base_mensal = 35877.27,
  aliquota_patronal = 0.28,
  auxilio_saude = 3587.73,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = true
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'Promotor de Justiça' AND
  cargos.classe = 'Inicial';

UPDATE parametros_cargo
SET 
  base_mensal = 34083.40,
  aliquota_patronal = 0.28,
  auxilio_saude = 3408.34,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = true
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'Promotor de Justiça' AND
  cargos.classe = 'Substituto';

-- Atualização dos valores para Servidores Efetivos
UPDATE parametros_cargo
SET 
  base_mensal = 8837.53,
  aliquota_patronal = 0.28,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'Analista Ministerial';

UPDATE parametros_cargo
SET 
  base_mensal = 5696.69,
  aliquota_patronal = 0.28,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'Técnico Ministerial';

-- Atualização dos valores para Cargos Comissionados
UPDATE parametros_cargo
SET 
  base_mensal = 12357.65,
  aliquota_patronal = 0.21,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'CC-09';

UPDATE parametros_cargo
SET 
  base_mensal = 10018.96,
  aliquota_patronal = 0.21,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'CC-08';

UPDATE parametros_cargo
SET 
  base_mensal = 8717.05,
  aliquota_patronal = 0.21,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'CC-07';

UPDATE parametros_cargo
SET 
  base_mensal = 6801.08,
  aliquota_patronal = 0.21,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'CC-06';

UPDATE parametros_cargo
SET 
  base_mensal = 5439.84,
  aliquota_patronal = 0.21,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'CC-05';

UPDATE parametros_cargo
SET 
  base_mensal = 4834.91,
  aliquota_patronal = 0.21,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'CC-04';

UPDATE parametros_cargo
SET 
  base_mensal = 4297.30,
  aliquota_patronal = 0.21,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'CC-03';

UPDATE parametros_cargo
SET 
  base_mensal = 2592.52,
  aliquota_patronal = 0.21,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'CC-02';

UPDATE parametros_cargo
SET 
  base_mensal = 1651.68,
  aliquota_patronal = 0.21,
  auxilio_saude = 1058.78,
  auxilio_alimentacao = 2231.73,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'CC-01';

-- Atualização dos valores para Estagiários
UPDATE parametros_cargo
SET 
  base_mensal = 1518.00,
  aliquota_patronal = 0,
  auxilio_saude = 0,
  auxilio_alimentacao = 0,
  auxilio_transporte = 176.00,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'Graduação';

UPDATE parametros_cargo
SET 
  base_mensal = 2277.00,
  aliquota_patronal = 0,
  auxilio_saude = 0,
  auxilio_alimentacao = 0,
  auxilio_transporte = 176.00,
  aplica_acervo = false
FROM cargos
WHERE 
  parametros_cargo.cargo_id = cargos.id AND
  cargos.nome = 'Pós-Graduação';