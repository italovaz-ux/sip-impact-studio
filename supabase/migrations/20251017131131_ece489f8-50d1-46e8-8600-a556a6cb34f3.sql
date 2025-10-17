-- Criar tabela para armazenar os cargos e quantidades de cada cenário
CREATE TABLE IF NOT EXISTS public.cenario_cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cenario_id UUID NOT NULL REFERENCES public.cenarios(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cenario_id, cargo_id)
);

-- Habilitar RLS
ALTER TABLE public.cenario_cargos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Qualquer um pode visualizar cenario_cargos" 
  ON public.cenario_cargos FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir cenario_cargos" 
  ON public.cenario_cargos FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar cenario_cargos" 
  ON public.cenario_cargos FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar cenario_cargos" 
  ON public.cenario_cargos FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cenario_cargos_updated_at
  BEFORE UPDATE ON public.cenario_cargos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();