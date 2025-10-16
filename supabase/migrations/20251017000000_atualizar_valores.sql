-- Atualizar valores dos Membros
UPDATE public.cargos 
SET nome = 'Procurador de Justiça', classe = 'Classe Especial'
WHERE grupo = 'MEMBRO' AND nome = 'Procurador de Justiça';

UPDATE public.cargos 
SET nome = 'Promotor de Justiça', classe = 'Entrância Final'
WHERE grupo = 'MEMBRO' AND nome = 'Promotor de Justiça' AND classe = 'Entrância Final';

UPDATE public.cargos 
SET nome = 'Promotor de Justiça', classe = 'Entrância Intermediária'
WHERE grupo = 'MEMBRO' AND nome = 'Promotor de Justiça' AND classe = 'Entrância Intermediária';

UPDATE public.cargos 
SET nome = 'Promotor de Justiça', classe = 'Entrância Inicial'
WHERE grupo = 'MEMBRO' AND nome = 'Promotor de Justiça' AND classe = 'Entrância Inicial';

UPDATE public.cargos 
SET nome = 'Promotor de Justiça', classe = 'Substituto'
WHERE grupo = 'MEMBRO' AND nome = 'Promotor de Justiça' AND classe = 'Substituto';

-- Atualizar valores dos subsídios dos Membros
UPDATE public.parametros_cargo
SET base_mensal = 41845.48, 
    aliquota_patronal = 0.28, 
    auxilio_saude = 41845.48 * 0.10, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = true
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'MEMBRO' 
AND cargos.classe = 'Classe Especial';

UPDATE public.parametros_cargo
SET base_mensal = 39753.21, 
    aliquota_patronal = 0.28, 
    auxilio_saude = 39753.21 * 0.10, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = true
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'MEMBRO' 
AND cargos.classe = 'Entrância Final';

UPDATE public.parametros_cargo
SET base_mensal = 37765.55, 
    aliquota_patronal = 0.28, 
    auxilio_saude = 37765.55 * 0.10, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = true
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'MEMBRO' 
AND cargos.classe = 'Entrância Intermediária';

UPDATE public.parametros_cargo
SET base_mensal = 35877.27, 
    aliquota_patronal = 0.28, 
    auxilio_saude = 35877.27 * 0.10, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = true
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'MEMBRO' 
AND cargos.classe = 'Entrância Inicial';

UPDATE public.parametros_cargo
SET base_mensal = 34083.40, 
    aliquota_patronal = 0.28, 
    auxilio_saude = 34083.40 * 0.10, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = true
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'MEMBRO' 
AND cargos.classe = 'Substituto';

-- Atualizar valores dos Servidores Efetivos
UPDATE public.parametros_cargo
SET base_mensal = 8837.53, 
    aliquota_patronal = 0.28, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'EFETIVO' 
AND cargos.classe = 'ANALISTA_MINISTERIAL';

UPDATE public.parametros_cargo
SET base_mensal = 5696.69, 
    aliquota_patronal = 0.28, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'EFETIVO' 
AND cargos.classe = 'TECNICO_MINISTERIAL';

-- Atualizar valores dos Cargos Comissionados
UPDATE public.cargos 
SET nome = 'Cargo Comissionado', classe = 'CC-09'
WHERE grupo = 'COMISSIONADO' AND classe = 'CC_09';

UPDATE public.cargos 
SET nome = 'Cargo Comissionado', classe = 'CC-08'
WHERE grupo = 'COMISSIONADO' AND classe = 'CC_08';

UPDATE public.cargos 
SET nome = 'Cargo Comissionado', classe = 'CC-07'
WHERE grupo = 'COMISSIONADO' AND classe = 'CC_07';

UPDATE public.cargos 
SET nome = 'Cargo Comissionado', classe = 'CC-06'
WHERE grupo = 'COMISSIONADO' AND classe = 'CC_06';

UPDATE public.cargos 
SET nome = 'Cargo Comissionado', classe = 'CC-05'
WHERE grupo = 'COMISSIONADO' AND classe = 'CC_05';

UPDATE public.cargos 
SET nome = 'Cargo Comissionado', classe = 'CC-04'
WHERE grupo = 'COMISSIONADO' AND classe = 'CC_04';

UPDATE public.cargos 
SET nome = 'Cargo Comissionado', classe = 'CC-03'
WHERE grupo = 'COMISSIONADO' AND classe = 'CC_03';

UPDATE public.cargos 
SET nome = 'Cargo Comissionado', classe = 'CC-02'
WHERE grupo = 'COMISSIONADO' AND classe = 'CC_02';

UPDATE public.cargos 
SET nome = 'Cargo Comissionado', classe = 'CC-01'
WHERE grupo = 'COMISSIONADO' AND classe = 'CC_01';

-- Atualizar valores dos Cargos Comissionados
UPDATE public.parametros_cargo
SET base_mensal = 12357.65, 
    aliquota_patronal = 0.21, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'COMISSIONADO' 
AND cargos.classe = 'CC-09';

UPDATE public.parametros_cargo
SET base_mensal = 10018.96, 
    aliquota_patronal = 0.21, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'COMISSIONADO' 
AND cargos.classe = 'CC-08';

UPDATE public.parametros_cargo
SET base_mensal = 8717.05, 
    aliquota_patronal = 0.21, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'COMISSIONADO' 
AND cargos.classe = 'CC-07';

UPDATE public.parametros_cargo
SET base_mensal = 6801.08, 
    aliquota_patronal = 0.21, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'COMISSIONADO' 
AND cargos.classe = 'CC-06';

UPDATE public.parametros_cargo
SET base_mensal = 5439.84, 
    aliquota_patronal = 0.21, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'COMISSIONADO' 
AND cargos.classe = 'CC-05';

UPDATE public.parametros_cargo
SET base_mensal = 4834.91, 
    aliquota_patronal = 0.21, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'COMISSIONADO' 
AND cargos.classe = 'CC-04';

UPDATE public.parametros_cargo
SET base_mensal = 4297.30, 
    aliquota_patronal = 0.21, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'COMISSIONADO' 
AND cargos.classe = 'CC-03';

UPDATE public.parametros_cargo
SET base_mensal = 2592.52, 
    aliquota_patronal = 0.21, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'COMISSIONADO' 
AND cargos.classe = 'CC-02';

UPDATE public.parametros_cargo
SET base_mensal = 1651.68, 
    aliquota_patronal = 0.21, 
    auxilio_saude = 1058.78, 
    auxilio_alimentacao = 2231.73, 
    aplica_acervo = false
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'COMISSIONADO' 
AND cargos.classe = 'CC-01';

-- Atualizar valores dos Estagiários
UPDATE public.parametros_cargo
SET base_mensal = 1518.00, 
    aliquota_patronal = 0, 
    auxilio_saude = NULL, 
    auxilio_alimentacao = NULL, 
    aplica_acervo = false,
    auxilio_transporte = 176.00
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'ESTAGIARIO' 
AND cargos.classe = 'Graduação';

UPDATE public.parametros_cargo
SET base_mensal = 2277.00, 
    aliquota_patronal = 0, 
    auxilio_saude = NULL, 
    auxilio_alimentacao = NULL, 
    aplica_acervo = false,
    auxilio_transporte = 176.00
FROM public.cargos
WHERE parametros_cargo.cargo_id = cargos.id 
AND cargos.grupo = 'ESTAGIARIO' 
AND cargos.classe = 'Pós-Graduação';