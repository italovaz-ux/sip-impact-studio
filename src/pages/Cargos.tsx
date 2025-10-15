import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, ArrowLeft } from "lucide-react";

interface Cargo {
  id: string;
  grupo: string;
  classe: string;
  nome: string;
  ativo: boolean;
}

interface Parametro {
  id: string;
  cargo_id: string;
  base_mensal: number;
  aliquota_patronal: number;
  auxilio_saude: number | null;
  auxilio_alimentacao: number | null;
  aplica_acervo: boolean;
  auxilio_transporte: number | null;
}

const Cargos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [parametros, setParametros] = useState<Record<string, Parametro>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Parametro>>({});

  useEffect(() => {
    loadCargos();
  }, []);

  const loadCargos = async () => {
    try {
      const { data: cargosData, error: cargosError } = await supabase
        .from("cargos")
        .select("*")
        .order("grupo", { ascending: true })
        .order("classe", { ascending: true });

      if (cargosError) throw cargosError;

      const { data: parametrosData, error: parametrosError } = await supabase
        .from("parametros_cargo")
        .select("*");

      if (parametrosError) throw parametrosError;

      setCargos(cargosData || []);
      
      const parametrosMap: Record<string, Parametro> = {};
      parametrosData?.forEach((p) => {
        parametrosMap[p.cargo_id] = p;
      });
      setParametros(parametrosMap);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar cargos",
        description: error.message,
      });
    }
  };

  const handleEdit = (cargoId: string) => {
    const param = parametros[cargoId];
    setEditingId(cargoId);
    setEditValues(param);
  };

  const handleSave = async (cargoId: string) => {
    try {
      const { error } = await supabase
        .from("parametros_cargo")
        .update({
          base_mensal: editValues.base_mensal,
          aliquota_patronal: editValues.aliquota_patronal,
          auxilio_saude: editValues.auxilio_saude,
          auxilio_alimentacao: editValues.auxilio_alimentacao,
          auxilio_transporte: editValues.auxilio_transporte,
        })
        .eq("cargo_id", cargoId);

      if (error) throw error;

      toast({
        title: "Parâmetros atualizados",
        description: "Os valores foram salvos com sucesso.",
      });

      setEditingId(null);
      loadCargos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getGrupoLabel = (grupo: string) => {
    const labels: Record<string, { text: string; variant: any }> = {
      MEMBRO: { text: "Membro", variant: "default" },
      EFETIVO: { text: "Efetivo", variant: "secondary" },
      COMISSIONADO: { text: "Comissionado", variant: "outline" },
      ESTAGIARIO: { text: "Estagiário", variant: "outline" },
    };
    return labels[grupo] || { text: grupo, variant: "default" };
  };

  const groupedCargos = cargos.reduce((acc, cargo) => {
    if (!acc[cargo.grupo]) acc[cargo.grupo] = [];
    acc[cargo.grupo].push(cargo);
    return acc;
  }, {} as Record<string, Cargo[]>);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Cargos</h2>
            <p className="text-muted-foreground">
              Visualize e edite os parâmetros de cálculo de cada cargo
            </p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        {Object.entries(groupedCargos).map(([grupo, cargosList]) => {
          const grupoInfo = getGrupoLabel(grupo);
          return (
            <Card key={grupo}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant={grupoInfo.variant}>{grupoInfo.text}</Badge>
                      <span className="text-lg">{cargosList.length} {cargosList.length === 1 ? 'cargo' : 'cargos'}</span>
                    </CardTitle>
                    <CardDescription>
                      Parâmetros de cálculo para {grupoInfo.text.toLowerCase()}s
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cargo</TableHead>
                        <TableHead className="text-right">Base Mensal</TableHead>
                        <TableHead className="text-right">Alíq. Patronal</TableHead>
                        <TableHead className="text-right">Aux. Saúde</TableHead>
                        <TableHead className="text-right">Aux. Alimentação</TableHead>
                        {grupo === "ESTAGIARIO" && <TableHead className="text-right">Aux. Transporte</TableHead>}
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cargosList.map((cargo) => {
                        const param = parametros[cargo.id];
                        const isEditing = editingId === cargo.id;

                        return (
                          <TableRow key={cargo.id}>
                            <TableCell className="font-medium">{cargo.nome}</TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editValues.base_mensal || 0}
                                  onChange={(e) =>
                                    setEditValues({ ...editValues, base_mensal: parseFloat(e.target.value) })
                                  }
                                  className="w-32 text-right"
                                />
                              ) : (
                                formatCurrency(param?.base_mensal)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.0001"
                                  value={editValues.aliquota_patronal || 0}
                                  onChange={(e) =>
                                    setEditValues({ ...editValues, aliquota_patronal: parseFloat(e.target.value) })
                                  }
                                  className="w-24 text-right"
                                />
                              ) : (
                                `${((param?.aliquota_patronal || 0) * 100).toFixed(2)}%`
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editValues.auxilio_saude || 0}
                                  onChange={(e) =>
                                    setEditValues({ ...editValues, auxilio_saude: parseFloat(e.target.value) })
                                  }
                                  className="w-32 text-right"
                                />
                              ) : (
                                formatCurrency(param?.auxilio_saude)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editValues.auxilio_alimentacao || 0}
                                  onChange={(e) =>
                                    setEditValues({ ...editValues, auxilio_alimentacao: parseFloat(e.target.value) })
                                  }
                                  className="w-32 text-right"
                                />
                              ) : (
                                formatCurrency(param?.auxilio_alimentacao)
                              )}
                            </TableCell>
                            {grupo === "ESTAGIARIO" && (
                              <TableCell className="text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editValues.auxilio_transporte || 0}
                                    onChange={(e) =>
                                      setEditValues({ ...editValues, auxilio_transporte: parseFloat(e.target.value) })
                                    }
                                    className="w-32 text-right"
                                  />
                                ) : (
                                  formatCurrency(param?.auxilio_transporte)
                                )}
                              </TableCell>
                            )}
                            <TableCell className="text-center">
                              {isEditing ? (
                                <div className="flex justify-center gap-2">
                                  <Button size="sm" onClick={() => handleSave(cargo.id)}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancel}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(cargo.id)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
};

export default Cargos;
