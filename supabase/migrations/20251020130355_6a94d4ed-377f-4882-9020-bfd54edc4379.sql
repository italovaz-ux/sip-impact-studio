-- Primeiro, remove as políticas que causam recursão
DROP POLICY IF EXISTS "Admins podem gerenciar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem visualizar todos os roles" ON public.user_roles;

-- Recria a função has_role se não existir (com SECURITY DEFINER para bypass RLS)
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

-- Cria políticas que usam a função SECURITY DEFINER
CREATE POLICY "Admins podem visualizar roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Política para usuários verem seu próprio role
CREATE POLICY "Usuarios podem ver seu proprio role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());