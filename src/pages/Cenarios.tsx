import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Cenario {
  id: string;
  nome: string;
  descricao: string | null;
  data_base: string;
  ativo: boolean;
  created_at: string;
}

const Cenarios = () => {
  const { toast } = useToast();
  const [cenarios, setCenarios] = useState<Cenario[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    data_base: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadCenarios();
  }, []);

  const loadCenarios = async () => {
    try {
      const { data, error } = await supabase
        .from("cenarios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCenarios(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar cenários",
        description: error.message,
      });
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from("cenarios").insert([formData]);

      if (error) throw error;

      toast({
        title: "Cenário criado",
        description: "O cenário foi criado com sucesso.",
      });

      setIsDialogOpen(false);
      setFormData({
        nome: "",
        descricao: "",
        data_base: new Date().toISOString().split("T")[0],
      });
      loadCenarios();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar cenário",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("cenarios").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Cenário excluído",
        description: "O cenário foi removido com sucesso.",
      });

      loadCenarios();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir cenário",
        description: error.message,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cenários de Simulação</h2>
            <p className="text-muted-foreground">
              Crie e gerencie cenários para análise de impacto de pessoal
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cenário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cenário</DialogTitle>
                <DialogDescription>
                  Preencha as informações do cenário de simulação
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Cenário</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Reajuste Anual 2025"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descreva o cenário e suas premissas..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_base">Data Base</Label>
                  <Input
                    id="data_base"
                    type="date"
                    value={formData.data_base}
                    onChange={(e) => setFormData({ ...formData, data_base: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={!formData.nome}>
                  Criar Cenário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {cenarios.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum cenário criado ainda</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Cenário
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Cenários Cadastrados</CardTitle>
              <CardDescription>
                {cenarios.length} {cenarios.length === 1 ? "cenário" : "cenários"} disponível
                {cenarios.length !== 1 ? "is" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data Base</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cenarios.map((cenario) => (
                    <TableRow key={cenario.id}>
                      <TableCell className="font-medium">{cenario.nome}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {cenario.descricao || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(cenario.data_base)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cenario.ativo ? "default" : "secondary"}>
                          {cenario.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(cenario.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Cenarios;
