import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, ShieldOff, ArrowLeft, Loader2 } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

const Usuarios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: userRoles, error } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (error) throw error;

      const userMap = new Map(userRoles?.map(ur => [ur.user_id, ur.role]) || []);

      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      const usersWithRoles: UserWithRole[] = authUsers.map(user => ({
        id: user.id,
        email: user.email || "",
        created_at: user.created_at,
        role: userMap.get(user.id) || "user",
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    try {
      setUpdatingUserId(userId);
      const newRole = currentRole === "admin" ? "user" : "admin";

      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast({
        title: "Permissão atualizada",
        description: `Usuário agora é ${newRole === "admin" ? "administrador" : "usuário comum"}.`,
      });

      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar permissão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (roleLoading || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h2>
            <p className="text-muted-foreground">
              Gerencie as permissões de acesso dos usuários do sistema
            </p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              Lista de todos os usuários e suas permissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Administrador" : "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRole(user.id, user.role)}
                          disabled={updatingUserId === user.id || user.email === "italovaz@mppi.mp.br"}
                        >
                          {updatingUserId === user.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : user.role === "admin" ? (
                            <ShieldOff className="mr-2 h-4 w-4" />
                          ) : (
                            <Shield className="mr-2 h-4 w-4" />
                          )}
                          {user.role === "admin" ? "Remover Admin" : "Tornar Admin"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Usuarios;
