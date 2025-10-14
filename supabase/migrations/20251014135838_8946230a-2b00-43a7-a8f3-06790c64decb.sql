-- Criar tipo enum para grupos de cargos
CREATE TYPE public.grupo_cargo AS ENUM ('MEMBRO', 'EFETIVO', 'COMISSIONADO', 'ESTAGIARIO');

-- Criar tipo enum para tipos de estagiário
CREATE TYPE public.tipo_estagiario AS ENUM ('GRADUACAO', 'POS_GRADUACAO');

-- Tabela de cargos (classes dentro de cada grupo)
CREATE TABLE public.cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo public.grupo_cargo NOT NULL,
  classe TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grupo, classe)
);

-- Tabela de parâmetros por cargo
CREATE TABLE public.parametros_cargo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  base_mensal NUMERIC(12,2) NOT NULL, -- subsídio ou vencimento base
  aliquota_patronal NUMERIC(5,4) NOT NULL, -- 0.28 ou 0.21
  auxilio_saude NUMERIC(12,2), -- fixo ou percentual
  auxilio_alimentacao NUMERIC(12,2),
  aplica_acervo BOOLEAN NOT NULL DEFAULT false,
  tipo_estagiario public.tipo_estagiario, -- apenas para estagiários
  auxilio_transporte NUMERIC(12,2), -- apenas para estagiários
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cargo_id)
);

-- Tabela de cenários (simulações)
CREATE TABLE public.cenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_base DATE NOT NULL DEFAULT CURRENT_DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de eventos (reajustes, provimentos)
CREATE TABLE public.eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cenario_id UUID NOT NULL REFERENCES public.cenarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  publico_alvo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de resultados mensais calculados
CREATE TABLE public.resultados_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cenario_id UUID NOT NULL REFERENCES public.cenarios(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  mes_ano DATE NOT NULL,
  base NUMERIC(12,2) NOT NULL,
  contrib_patronal NUMERIC(12,2) NOT NULL DEFAULT 0,
  auxilio_saude NUMERIC(12,2) NOT NULL DEFAULT 0,
  auxilio_alimentacao NUMERIC(12,2) NOT NULL DEFAULT 0,
  acervo NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_mensal NUMERIC(12,2) NOT NULL,
  total_anual NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cenario_id, cargo_id, mes_ano)
);

-- Enable RLS on all tables
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_cargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_mensais ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (público para análise, mas autenticado para modificação)
CREATE POLICY "Qualquer um pode visualizar cargos" 
  ON public.cargos FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir cargos" 
  ON public.cargos FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar cargos" 
  ON public.cargos FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar cargos" 
  ON public.cargos FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Políticas para parâmetros
CREATE POLICY "Qualquer um pode visualizar parâmetros" 
  ON public.parametros_cargo FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir parâmetros" 
  ON public.parametros_cargo FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar parâmetros" 
  ON public.parametros_cargo FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar parâmetros" 
  ON public.parametros_cargo FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Políticas para cenários
CREATE POLICY "Qualquer um pode visualizar cenários" 
  ON public.cenarios FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir cenários" 
  ON public.cenarios FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar cenários" 
  ON public.cenarios FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar cenários" 
  ON public.cenarios FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Políticas para eventos
CREATE POLICY "Qualquer um pode visualizar eventos" 
  ON public.eventos FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir eventos" 
  ON public.eventos FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar eventos" 
  ON public.eventos FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Políticas para resultados
CREATE POLICY "Qualquer um pode visualizar resultados" 
  ON public.resultados_mensais FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir resultados" 
  ON public.resultados_mensais FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar resultados" 
  ON public.resultados_mensais FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_cargos_updated_at
  BEFORE UPDATE ON public.cargos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parametros_updated_at
  BEFORE UPDATE ON public.parametros_cargo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cenarios_updated_at
  BEFORE UPDATE ON public.cenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais das classes de cada grupo

-- Membros do Ministério Público
INSERT INTO public.cargos (grupo, classe, nome) VALUES
  ('MEMBRO', 'PROMOTOR_SUBSTITUTO', 'Promotor Substituto'),
  ('MEMBRO', 'PROMOTOR_ENTRANCIA_INICIAL', 'Promotor de Justiça - Entrância Inicial'),
  ('MEMBRO', 'PROMOTOR_ENTRANCIA_INTERMEDIARIA', 'Promotor de Justiça - Entrância Intermediária'),
  ('MEMBRO', 'PROMOTOR_ENTRANCIA_FINAL', 'Promotor de Justiça - Entrância Final'),
  ('MEMBRO', 'PROCURADOR_JUSTICA', 'Procurador de Justiça');

-- Servidores Efetivos
INSERT INTO public.cargos (grupo, classe, nome) VALUES
  ('EFETIVO', 'ANALISTA_MINISTERIAL', 'Analista Ministerial'),
  ('EFETIVO', 'TECNICO_MINISTERIAL', 'Técnico Ministerial');

-- Servidores Comissionados (CC-01 a CC-09)
INSERT INTO public.cargos (grupo, classe, nome) VALUES
  ('COMISSIONADO', 'CC_01', 'Cargo Comissionado - Nível 01'),
  ('COMISSIONADO', 'CC_02', 'Cargo Comissionado - Nível 02'),
  ('COMISSIONADO', 'CC_03', 'Cargo Comissionado - Nível 03'),
  ('COMISSIONADO', 'CC_04', 'Cargo Comissionado - Nível 04'),
  ('COMISSIONADO', 'CC_05', 'Cargo Comissionado - Nível 05'),
  ('COMISSIONADO', 'CC_06', 'Cargo Comissionado - Nível 06'),
  ('COMISSIONADO', 'CC_07', 'Cargo Comissionado - Nível 07'),
  ('COMISSIONADO', 'CC_08', 'Cargo Comissionado - Nível 08'),
  ('COMISSIONADO', 'CC_09', 'Cargo Comissionado - Nível 09');

-- Estagiários
INSERT INTO public.cargos (grupo, classe, nome) VALUES
  ('ESTAGIARIO', 'GRADUACAO', 'Estagiário - Graduação'),
  ('ESTAGIARIO', 'POS_GRADUACAO', 'Estagiário - Pós-Graduação');

-- Inserir parâmetros padrão (valores exemplificativos, podem ser editados)
-- Membros (exemplo com subsídio base de R$ 30.000,00)
INSERT INTO public.parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 30000.00, 0.28, 0, 2231.73, true
FROM public.cargos WHERE grupo = 'MEMBRO';

-- Atualizar auxílio saúde para membros (10% do subsídio será calculado dinamicamente, mas inserindo 0 aqui)
-- Na verdade, para membros, auxílio_saúde é 10% do subsídio, vamos deixar como valor fixo por enquanto

-- Servidores Efetivos (exemplo: Analista R$ 8.000, Técnico R$ 5.000)
INSERT INTO public.parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 
  CASE 
    WHEN classe = 'ANALISTA_MINISTERIAL' THEN 8000.00 
    WHEN classe = 'TECNICO_MINISTERIAL' THEN 5000.00 
  END,
  0.28, 1058.78, 2231.73, false
FROM public.cargos WHERE grupo = 'EFETIVO';

-- Servidores Comissionados (exemplo crescente CC-01: R$ 3.000 até CC-09: R$ 15.000)
INSERT INTO public.parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo)
SELECT id, 
  CASE classe
    WHEN 'CC_01' THEN 3000.00
    WHEN 'CC_02' THEN 4500.00
    WHEN 'CC_03' THEN 6000.00
    WHEN 'CC_04' THEN 7500.00
    WHEN 'CC_05' THEN 9000.00
    WHEN 'CC_06' THEN 10500.00
    WHEN 'CC_07' THEN 12000.00
    WHEN 'CC_08' THEN 13500.00
    WHEN 'CC_09' THEN 15000.00
  END,
  0.21, 1058.78, 2231.73, false
FROM public.cargos WHERE grupo = 'COMISSIONADO';

-- Estagiários
INSERT INTO public.parametros_cargo (cargo_id, base_mensal, aliquota_patronal, auxilio_saude, auxilio_alimentacao, aplica_acervo, tipo_estagiario, auxilio_transporte)
SELECT id,
  CASE classe
    WHEN 'GRADUACAO' THEN 1058.78
    WHEN 'POS_GRADUACAO' THEN 2231.73
  END,
  0, NULL, NULL, false,
  CASE classe
    WHEN 'GRADUACAO' THEN 'GRADUACAO'::public.tipo_estagiario
    WHEN 'POS_GRADUACAO' THEN 'POS_GRADUACAO'::public.tipo_estagiario
  END,
  176.00
FROM public.cargos WHERE grupo = 'ESTAGIARIO';