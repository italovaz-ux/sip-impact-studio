import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, TrendingUp } from "lucide-react";

const Relatorios = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
            <p className="text-muted-foreground">
              Visualize e exporte relatórios de análise de impacto de pessoal
            </p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="mt-4">Relatório de Cenários</CardTitle>
              <CardDescription>
                Análise comparativa de todos os cenários cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                Exportar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
              </div>
              <CardTitle className="mt-4">Análise de Impacto</CardTitle>
              <CardDescription>
                Projeções e tendências de impacto financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                Exportar Análise
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Em Desenvolvimento</CardTitle>
            <CardDescription>
              Esta seção está em construção. Em breve você poderá:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Gerar relatórios detalhados por cenário</li>
              <li>Exportar dados em formato PDF e Excel</li>
              <li>Visualizar gráficos de tendências</li>
              <li>Comparar múltiplos cenários simultaneamente</li>
              <li>Criar relatórios personalizados</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Relatorios;
