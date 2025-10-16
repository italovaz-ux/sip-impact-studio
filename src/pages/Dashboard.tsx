import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Award, GraduationCap, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CargoWithParams {
  id: string;
  nome: string;
  classe: string;
  grupo: string;
  base_mensal: number;
  aliquota_patronal: number;
  auxilio_saude: number;
  auxilio_alimentacao: number;
  aplica_acervo: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    membros: 0,
    efetivos: 0,
    comissionados: 0,
    estagiarios: 0,
    cenarios: 0,
  });
  const [cargosData, setCargosData] = useState<CargoWithParams[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("MEMBRO");

  useEffect(() => {
    loadStats();
    loadCargosData();
  }, []);

  const loadStats = async () => {
    try {
      const { data: cargos } = await supabase.from("cargos").select("grupo");
      const { data: cenarios } = await supabase.from("cenarios").select("id");

      if (cargos) {
        setStats({
          membros: cargos.filter((c) => c.grupo === "MEMBRO").length,
          efetivos: cargos.filter((c) => c.grupo === "EFETIVO").length,
          comissionados: cargos.filter((c) => c.grupo === "COMISSIONADO").length,
          estagiarios: cargos.filter((c) => c.grupo === "ESTAGIARIO").length,
          cenarios: cenarios?.length || 0,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const loadCargosData = async () => {
    try {
      const { data, error } = await supabase
        .from("cargos")
        .select(`
          id,
          nome,
          classe,
          grupo,
          parametros_cargo (
            base_mensal,
            aliquota_patronal,
            auxilio_saude,
            auxilio_alimentacao,
            aplica_acervo
          )
        `)
        .eq("ativo", true);

      if (error) throw error;

      const formatted = data?.map((cargo: any) => ({
        id: cargo.id,
        nome: cargo.nome,
        classe: cargo.classe,
        grupo: cargo.grupo,
        base_mensal: cargo.parametros_cargo?.[0]?.base_mensal || 0,
        aliquota_patronal: cargo.parametros_cargo?.[0]?.aliquota_patronal || 0,
        auxilio_saude: cargo.parametros_cargo?.[0]?.auxilio_saude || 0,
        auxilio_alimentacao: cargo.parametros_cargo?.[0]?.auxilio_alimentacao || 0,
        aplica_acervo: cargo.parametros_cargo?.[0]?.aplica_acervo || false,
      })) || [];

      setCargosData(formatted);
    } catch (error) {
      console.error("Erro ao carregar dados dos cargos:", error);
    }
  };

  const calculateValues = (cargo: CargoWithParams) => {
    const baseMensal = cargo.base_mensal;
    const aliqPatronal = (baseMensal * cargo.aliquota_patronal) / 100;
    const auxSaude = cargo.auxilio_saude;
    const auxAlimentacao = cargo.auxilio_alimentacao;
    const acervo = cargo.aplica_acervo ? baseMensal * 0.10 : 0; // 10% quando aplicável
    
    const mensal = baseMensal + aliqPatronal + auxSaude + auxAlimentacao + acervo;
    const decimoTerceiro = baseMensal + aliqPatronal + auxSaude + acervo;
    const ferias = baseMensal + (baseMensal / 3) + aliqPatronal + auxSaude + acervo;
    const anual = (mensal * 12) + decimoTerceiro + ferias;

    return {
      mensal,
      decimoTerceiro,
      ferias,
      anual,
      aliqPatronal,
      acervo,
    };
  };

  const filteredCargos = cargosData.filter((c) => c.grupo === selectedGroup);
  const totalAnualGrupo = filteredCargos.reduce((sum, cargo) => {
    return sum + calculateValues(cargo).anual;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const statCards = [
    {
      title: "Membros do MP",
      value: stats.membros,
      description: "Classes de membros cadastradas",
      icon: Award,
      color: "from-primary to-primary/80",
    },
    {
      title: "Servidores Efetivos",
      value: stats.efetivos,
      description: "Cargos efetivos cadastrados",
      icon: Users,
      color: "from-accent to-accent/80",
    },
    {
      title: "Comissionados",
      value: stats.comissionados,
      description: "Níveis CC cadastrados",
      icon: Briefcase,
      color: "from-blue-600 to-blue-500",
    },
    {
      title: "Estagiários",
      value: stats.estagiarios,
      description: "Tipos de estágio",
      icon: GraduationCap,
      color: "from-purple-600 to-purple-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema de cálculo de impacto de pessoal
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="transition-shadow hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Cargos</CardTitle>
              <CardDescription>
                Cadastre e edite cargos, classes e parâmetros de cálculo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/cargos")} className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Cargos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cenários de Simulação</CardTitle>
              <CardDescription>
                Crie e gerencie cenários para análise de impacto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/cenarios")} className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Gerenciar Cenários
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Parâmetros por Grupo</CardTitle>
            <CardDescription>
              Visualize os cálculos detalhados de cada cargo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="MEMBRO">Membros do MP</TabsTrigger>
                <TabsTrigger value="EFETIVO">Servidores Efetivos</TabsTrigger>
                <TabsTrigger value="COMISSIONADO">Comissionados</TabsTrigger>
                <TabsTrigger value="ESTAGIARIO">Estagiários</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedGroup} className="mt-6">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cargo</TableHead>
                        <TableHead className="text-right">Base Mensal</TableHead>
                        <TableHead className="text-right">Aliq Patronal</TableHead>
                        <TableHead className="text-right">Aux Saúde</TableHead>
                        <TableHead className="text-right">Aux Alimentação</TableHead>
                        {filteredCargos.some((c) => c.aplica_acervo) && (
                          <TableHead className="text-right">Acervo</TableHead>
                        )}
                        <TableHead className="text-right">Mensal</TableHead>
                        <TableHead className="text-right">13º</TableHead>
                        <TableHead className="text-right">Férias</TableHead>
                        <TableHead className="text-right">Anual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCargos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground">
                            Nenhum cargo cadastrado neste grupo
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCargos.map((cargo) => {
                          const calc = calculateValues(cargo);
                          return (
                            <TableRow key={cargo.id}>
                              <TableCell className="font-medium">
                                {cargo.nome}
                                {cargo.classe && (
                                  <span className="text-xs text-muted-foreground block">
                                    {cargo.classe}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(cargo.base_mensal)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(calc.aliqPatronal)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(cargo.auxilio_saude)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(cargo.auxilio_alimentacao)}</TableCell>
                              {filteredCargos.some((c) => c.aplica_acervo) && (
                                <TableCell className="text-right">{formatCurrency(calc.acervo)}</TableCell>
                              )}
                              <TableCell className="text-right font-medium">{formatCurrency(calc.mensal)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(calc.decimoTerceiro)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(calc.ferias)}</TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(calc.anual)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                      {filteredCargos.length > 0 && (
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={filteredCargos.some((c) => c.aplica_acervo) ? 9 : 8} className="text-right font-bold">
                            TOTAL ANUAL DO GRUPO:
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            R$ {formatCurrency(totalAnualGrupo)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
