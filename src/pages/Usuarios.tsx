import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, ArrowLeft, Key, Eye, EyeOff } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Usuarios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changeOwnPassword, setChangeOwnPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (isAdmin) {
      loadUsers();
      loadCurrentUser();
    }
  }, [isAdmin, roleLoading, navigate]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadUsers = async () => {
    try {
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
      setUsers(authUsers || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: error.message,
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) throw error;

      toast({
        title: "Usuário criado com sucesso!",
        description: `O usuário ${email} foi adicionado ao sistema.`,
      });

      setEmail("");
      setPassword("");
      setShowPassword(false);
      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(deleteUserId);

      if (error) throw error;

      toast({
        title: "Usuário removido",
        description: "O usuário foi removido do sistema.",
      });

      setDeleteUserId(null);
      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover usuário",
        description: error.message,
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword) return;

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        resetPasswordUserId,
        { password: newPassword }
      );

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "A senha do usuário foi atualizada com sucesso.",
      });

      setResetPasswordUserId(null);
      setNewPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message,
      });
    }
  };

  const handleChangeOwnPassword = async () => {
    if (!newPassword) return;

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
      });

      setChangeOwnPassword(false);
      setNewPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message,
      });
    }
  };

  if (roleLoading || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">
              Controle completo de usuários e segurança do sistema
            </p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Segurança da Conta</CardTitle>
            <CardDescription>
              Altere sua senha de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setChangeOwnPassword(true)}
              variant="outline"
              className="gap-2"
            >
              <Key className="h-4 w-4" />
              Alterar Minha Senha
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Usuário</CardTitle>
            <CardDescription>
              Adicione novos usuários ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@mp.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Usuário"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              Lista de todos os usuários do sistema com controle de senhas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResetPasswordUserId(user.id)}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Alterar Senha
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteUserId(user.id)}
                        disabled={user.email === "italovaz@gmail.com"}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para alterar senha própria */}
      <Dialog open={changeOwnPassword} onOpenChange={setChangeOwnPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Minha Senha</DialogTitle>
            <DialogDescription>
              Digite sua nova senha de administrador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="own-new-password">Nova Senha</Label>
              <Input
                id="own-new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setChangeOwnPassword(false);
              setNewPassword("");
            }}>
              Cancelar
            </Button>
            <Button onClick={handleChangeOwnPassword}>
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para resetar senha de usuário */}
      <Dialog open={!!resetPasswordUserId} onOpenChange={() => {
        setResetPasswordUserId(null);
        setNewPassword("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha do Usuário</DialogTitle>
            <DialogDescription>
              Digite a nova senha para este usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-new-password">Nova Senha</Label>
              <Input
                id="user-new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResetPasswordUserId(null);
              setNewPassword("");
            }}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword}>
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
              O usuário perderá acesso imediatamente ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Usuarios;
