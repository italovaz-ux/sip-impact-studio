import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Award, GraduationCap, Plus, FileText } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    membros: 0,
    efetivos: 0,
    comissionados: 0,
    estagiarios: 0,
    cenarios: 0,
  });

  useEffect(() => {
    loadStats();
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

        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Principais funcionalidades do sistema</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" onClick={() => navigate("/cargos")}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cargo
            </Button>
            <Button variant="outline" onClick={() => navigate("/cenarios")}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cenário
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
