-- Limpar dados existentes
DELETE FROM parametros_cargo;
DELETE FROM cargos;

-- Inserir Membros do MP na ordem especificada
INSERT INTO cargos (nome, classe, grupo, descricao) VALUES
('Procurador de Justiça', 'Classe Especial', 'MEMBRO', 'Procurador de Justiça'),
('Promotor de Justiça', 'Entrância Final', 'MEMBRO', 'Promotor de Justiça - Entrância Final'),
('Promotor de Justiça', 'Entrância Intermediária', 'MEMBRO', 'Promotor de Justiça - Entrância Intermediária'),
('Promotor de Justiça', 'Entrância Inicial', 'MEMBRO', 'Promotor de Justiça - Entrância Inicial'),
('Promotor Substituto', 'Substituto', 'MEMBRO', 'Promotor Substituto');

-- Inserir Servidores Efetivos
INSERT INTO cargos (nome, classe, grupo, descricao) VALUES
('Analista', 'Analista', 'EFETIVO', 'Analista do Ministério Público'),
('Técnico', 'Técnico', 'EFETIVO', 'Técnico do Ministério Público');

-- Inserir Cargos Comissionados na ordem especificada
INSERT INTO cargos (nome, classe, grupo, descricao) VALUES
('CC-09', 'Nível 09', 'COMISSIONADO', 'Cargo Comissionado Nível 09'),
('CC-08', 'Nível 08', 'COMISSIONADO', 'Cargo Comissionado Nível 08'),
('CC-07', 'Nível 07', 'COMISSIONADO', 'Cargo Comissionado Nível 07'),
('CC-06', 'Nível 06', 'COMISSIONADO', 'Cargo Comissionado Nível 06'),
('CC-05', 'Nível 05', 'COMISSIONADO', 'Cargo Comissionado Nível 05'),
('CC-04', 'Nível 04', 'COMISSIONADO', 'Cargo Comissionado Nível 04'),
('CC-03', 'Nível 03', 'COMISSIONADO', 'Cargo Comissionado Nível 03'),
('CC-02', 'Nível 02', 'COMISSIONADO', 'Cargo Comissionado Nível 02'),
('CC-01', 'Nível 01', 'COMISSIONADO', 'Cargo Comissionado Nível 01');

-- Inserir Estagiários
INSERT INTO cargos (nome, classe, grupo, descricao) VALUES
('Estagiário', 'Graduação', 'ESTAGIARIO', 'Estagiário de Graduação'),
('Estagiário', 'Pós-Graduação', 'ESTAGIARIO', 'Estagiário de Pós-Graduação');

-- Inserir parâmetros para Membros do MP (com acervo de 10%, alíquota 0.20 = 20%)
INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 41845.48, 0.20, 500, 800, true FROM cargos WHERE nome = 'Procurador de Justiça' AND classe = 'Classe Especial';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 39753.21, 0.20, 500, 800, true FROM cargos WHERE nome = 'Promotor de Justiça' AND classe = 'Entrância Final';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 37765.55, 0.20, 500, 800, true FROM cargos WHERE nome = 'Promotor de Justiça' AND classe = 'Entrância Intermediária';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 35877.27, 0.20, 500, 800, true FROM cargos WHERE nome = 'Promotor de Justiça' AND classe = 'Entrância Inicial';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 34083.40, 0.20, 500, 800, true FROM cargos WHERE nome = 'Promotor Substituto' AND classe = 'Substituto';

-- Inserir parâmetros para Servidores Efetivos
INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 8837.53, 0.20, 300, 600, false FROM cargos WHERE nome = 'Analista' AND grupo = 'EFETIVO';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 5696.69, 0.20, 300, 600, false FROM cargos WHERE nome = 'Técnico' AND grupo = 'EFETIVO';

-- Inserir parâmetros para Cargos Comissionados
INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 12357.65, 0.20, 300, 600, false FROM cargos WHERE nome = 'CC-09';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 10018.96, 0.20, 300, 600, false FROM cargos WHERE nome = 'CC-08';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 8717.05, 0.20, 300, 600, false FROM cargos WHERE nome = 'CC-07';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 6801.08, 0.20, 300, 600, false FROM cargos WHERE nome = 'CC-06';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 5439.84, 0.20, 300, 600, false FROM cargos WHERE nome = 'CC-05';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 4834.91, 0.20, 300, 600, false FROM cargos WHERE nome = 'CC-04';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 4297.30, 0.20, 300, 600, false FROM cargos WHERE nome = 'CC-03';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 2592.52, 0.20, 300, 600, false FROM cargos WHERE nome = 'CC-02';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 1651.68, 0.20, 300, 600, false FROM cargos WHERE nome = 'CC-01';

-- Inserir parâmetros para Estagiários (sem auxílios e sem acervo)
INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 1518.00, 0.20, 0, 0, false FROM cargos WHERE nome = 'Estagiário' AND classe = 'Graduação';

INSERT INTO parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 2277.00, 0.20, 0, 0, false FROM cargos WHERE nome = 'Estagiário' AND classe = 'Pós-Graduação';