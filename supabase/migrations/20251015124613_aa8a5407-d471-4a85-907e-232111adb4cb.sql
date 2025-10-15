-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles dos usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para admins visualizarem todos os roles
CREATE POLICY "Admins podem visualizar todos os roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para admins gerenciarem roles
CREATE POLICY "Admins podem gerenciar roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para adicionar role automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se for o email do admin, adiciona role admin
  IF NEW.email = 'italovaz@mppi.mp.br' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Outros usuários recebem role user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para adicionar role automaticamente
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Atualizar políticas de cargos e parametros_cargo para permitir apenas admins editarem
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar cargos" ON public.cargos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar cargos" ON public.cargos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir cargos" ON public.cargos;

CREATE POLICY "Admins podem atualizar cargos"
ON public.cargos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar cargos"
ON public.cargos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir cargos"
ON public.cargos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Atualizar políticas de parametros_cargo
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar parâmetros" ON public.parametros_cargo;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar parâmetros" ON public.parametros_cargo;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir parâmetros" ON public.parametros_cargo;

CREATE POLICY "Admins podem atualizar parâmetros"
ON public.parametros_cargo
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar parâmetros"
ON public.parametros_cargo
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir parâmetros"
ON public.parametros_cargo
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));