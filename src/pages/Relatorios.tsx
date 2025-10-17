import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Cenario {
  id: string;
  nome: string;
  descricao: string | null;
  data_base: string;
  ativo: boolean;
  created_at: string;
}

interface CargoWithParams {
  id: string;
  nome: string;
  classe: string;
  grupo: string;
  base_mensal: number;
  aliquota_patronal: number;
  auxilio_saude: number;
  auxilio_alimentacao: number;
  auxilio_transporte?: number;
  aplica_acervo: boolean;
}

interface CsvRow {
  label: string;
  base: number;
  contrib: number;
  aux: number;
  alimentacao: number;
  acervo: number;
  mensal: number;
  decimo: number;
  ferias: number;
  anual: number;
}

interface ScenarioItem { cargoId: string; quantidade: number; }

const Relatorios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cargosData, setCargosData] = useState<CargoWithParams[]>([]);
  const [csvMap, setCsvMap] = useState<Record<string, CsvRow>>({});
  const [csvNormMap, setCsvNormMap] = useState<Record<string, CsvRow>>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadCsvCalculations();
      await loadCargosData();
    };
    init();
  }, []);

  const parseBRLToNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value
      .replace(/\s/g, "")
      .replace(/R\$/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".")
      .replace(/\"/g, "")
      .trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const splitCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { result.push(current); current = ""; } else { current += char; }
    }
    result.push(current);
    return result.map((c) => c.trim());
  };

  const normalizeLabel = (s: string): string => {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*/g, '-')
      .trim();
  };

  const loadCsvCalculations = async (): Promise<Record<string, CsvRow>> => {
    try {
      const res = await fetch('/calculos.csv');
      const text = await res.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const map: Record<string, CsvRow> = {};
      for (const line of lines) {
        const cells = splitCsvLine(line);
        if (!cells[0] || cells[0].length === 0) continue;
        const label = cells[0];
        if (cells.length < 10) continue;
        const row: CsvRow = {
          label,
          base: parseBRLToNumber(cells[1]),
          contrib: parseBRLToNumber(cells[2]),
          aux: parseBRLToNumber(cells[3]),
          alimentacao: parseBRLToNumber(cells[4]),
          acervo: parseBRLToNumber(cells[5]),
          mensal: parseBRLToNumber(cells[6]),
          decimo: parseBRLToNumber(cells[7]),
          ferias: parseBRLToNumber(cells[8]),
          anual: parseBRLToNumber(cells[9]),
        };
        map[label] = row;
      }
      setCsvMap(map);
      const norm: Record<string, CsvRow> = {};
      Object.keys(map).forEach((label) => { norm[normalizeLabel(label)] = map[label]; });
      setCsvNormMap(norm);
      return map;
    } catch (error) {
      console.error('Erro ao carregar calculos.csv:', error);
      return {};
    }
  };

  const labelForCargo = (cargo: any): string => {
    if (cargo.grupo === 'MEMBRO') {
      const nomeLower = (cargo.nome || '').toLowerCase();
      const classeLower = (cargo.classe || '').toLowerCase();
      if (cargo.nome === 'Procurador de Justiça') return 'Procurador de Justiça';
      if (nomeLower.includes('promotor')) {
        if (classeLower.includes('final')) return 'Promotor de Entrância Final';
        if (classeLower.includes('intermedi')) return 'Promotor de Entrância Intermediária';
        if (classeLower.includes('inicial')) return 'Promotor de Entrância Inicial';
        if (nomeLower.includes('substituto') || classeLower.includes('substituto')) return 'Promotor Substituto';
        return 'Promotor de Entrância';
      }
    } else if (cargo.grupo === 'EFETIVO') {
      const nomeLower = (cargo.nome || '').toLowerCase();
      if (nomeLower.includes('analista')) return 'Analista Ministerial';
      if (nomeLower.includes('técnico') || nomeLower.includes('tecnico')) return 'Técnico Ministerial';
      return cargo.nome;
    } else if (cargo.grupo === 'COMISSIONADO') {
      const nome = (cargo.nome || '').trim();
      const m = nome.match(/^cc[\s-]?(\d{2})/i);
      if (m) { return `CC-${m[1]}`; }
      return nome;
    } else if (cargo.grupo === 'ESTAGIARIO') {
      const nomeLower = (cargo.nome || '').toLowerCase();
      const classeLower = (cargo.classe || '').toLowerCase();
      if (nomeLower.includes('pós') || nomeLower.includes('pos') || classeLower.includes('pós') || classeLower.includes('pos')) {
        return 'Estagiário de Pós Graduação';
      }
      return 'Estagiário de Graduação';
    }
    return cargo.nome;
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
            auxilio_transporte,
            aplica_acervo
          )
        `)
        .eq("ativo", true);

      if (error) throw error;
      const formatted = (data || []).map((cargo: any) => {
        const isEstagiario = cargo.grupo === 'ESTAGIARIO';
        return {
          id: cargo.id,
          nome: cargo.nome,
          classe: cargo.classe,
          grupo: cargo.grupo,
          base_mensal: cargo.parametros_cargo?.[0]?.base_mensal ?? 0,
          aliquota_patronal: cargo.parametros_cargo?.[0]?.aliquota_patronal ?? 0,
          auxilio_saude: isEstagiario ? 0 : (cargo.parametros_cargo?.[0]?.auxilio_saude ?? 0),
          auxilio_alimentacao: cargo.parametros_cargo?.[0]?.auxilio_alimentacao ?? 0,
          auxilio_transporte: isEstagiario ? (cargo.parametros_cargo?.[0]?.auxilio_transporte ?? 176.00) : (cargo.parametros_cargo?.[0]?.auxilio_transporte ?? 0),
          aplica_acervo: cargo.parametros_cargo?.[0]?.aplica_acervo ?? false,
        } as CargoWithParams;
      });
      setCargosData(formatted);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao carregar cargos", description: error.message });
    }
  };

  const computeFromParams = (cargo: CargoWithParams) => {
    const baseMensal = cargo.base_mensal;
    const auxSaude = cargo.auxilio_saude || 0;
    const auxAlimentacao = cargo.auxilio_alimentacao || 0;
    const acervo = cargo.aplica_acervo ? 800 : 0;

    let contrib = 0;
    let decimo = 0;
    let ferias = 0;

    if (cargo.grupo === "MEMBRO") {
      contrib = baseMensal * cargo.aliquota_patronal;
      decimo = baseMensal + contrib;
      ferias = baseMensal + (baseMensal / 3);
    } else if (cargo.grupo === "EFETIVO") {
      contrib = baseMensal * cargo.aliquota_patronal;
      decimo = baseMensal + contrib;
      ferias = baseMensal + (baseMensal / 3);
    } else if (cargo.grupo === "COMISSIONADO") {
      contrib = baseMensal * cargo.aliquota_patronal;
      decimo = baseMensal + contrib;
      ferias = baseMensal + (baseMensal / 3) + ((baseMensal + (baseMensal / 3)) * cargo.aliquota_patronal);
    } else if (cargo.grupo === "ESTAGIARIO") {
      decimo = 0;
      ferias = 0;
    }

    const mensal = baseMensal + contrib + (cargo.grupo === 'ESTAGIARIO' ? 0 : auxSaude) + (cargo.grupo === 'ESTAGIARIO' ? 0 : auxAlimentacao) + (cargo.grupo === 'ESTAGIARIO' ? 0 : acervo) + (cargo.grupo === 'ESTAGIARIO' ? (cargo.auxilio_transporte || 176.00) : 0);

    const anual = cargo.grupo === 'ESTAGIARIO'
      ? 12 * (baseMensal + (cargo.auxilio_transporte || 176.00))
      : (mensal * 12) + decimo + ferias;

    const aux = cargo.grupo === 'ESTAGIARIO' ? (cargo.auxilio_transporte || 176.00) : auxSaude;

    return { base: baseMensal, contrib, aux, alimentacao: auxAlimentacao, acervo, mensal, decimo, ferias, anual };
  };

  const loadScenarioItems = async (id: string): Promise<ScenarioItem[]> => {
    try {
      const { data, error } = await supabase
        .from("cenario_cargos")
        .select("cargo_id, quantidade")
        .eq("cenario_id", id);
      if (error) throw error;
      return (data || []).map((it: any) => ({ cargoId: it.cargo_id, quantidade: it.quantidade }));
    } catch (err) {
      console.error("Erro ao carregar itens do cenário:", err);
      return [];
    }
  };

  const exportScenariosCsv = async () => {
    try {
      setExporting(true);
      // Carregar cenários
      const { data: cenarios, error } = await supabase
        .from("cenarios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const headers = [
        'Cenario', 'Cenario_ID', 'Data_Base',
        'Cargo_ID', 'Cargo_Nome', 'Grupo', 'Classe', 'Label_CSV',
        'Quantidade',
        'Base', 'Contrib', 'Aux', 'Alimentacao', 'Acervo',
        'Mensal_Unit', 'Decimo', 'Ferias', 'Anual_Unit',
        'Mensal_Total', 'Anual_Total'
      ];
      const rows: string[] = [];
      rows.push(headers.join(','));

      for (const cenario of (cenarios || [])) {
        const items = await loadScenarioItems(cenario.id);
        for (const item of items) {
          const cargo = cargosData.find(c => c.id === item.cargoId);
          if (!cargo) continue;
          const label = labelForCargo(cargo);
          const csv = csvNormMap[normalizeLabel(label)] || csvMap[label];
          const vals = csv ? csv : computeFromParams(cargo);
          const mensalTotal = vals.mensal * item.quantidade;
          const anualTotal = vals.anual * item.quantidade;
          const row = [
            sanitize(cenario.nome), sanitize(cenario.id), sanitize(cenario.data_base),
            sanitize(cargo.id), sanitize(cargo.nome), sanitize(cargo.grupo), sanitize(cargo.classe), sanitize(label),
            item.quantidade.toString(),
            n(vals.base), n(vals.contrib), n(vals.aux), n(vals.alimentacao), n(vals.acervo),
            n(vals.mensal), n(vals.decimo), n(vals.ferias), n(vals.anual),
            n(mensalTotal), n(anualTotal)
          ].join(',');
          rows.push(row);
        }
      }

      const csvText = rows.join('\n');
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_cenarios_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Relatório exportado', description: 'Arquivo CSV gerado com sucesso.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao exportar', description: err.message || 'Falha ao gerar CSV.' });
    } finally {
      setExporting(false);
    }
  };

  const sanitize = (v: any) => {
    const s = (v ?? '').toString();
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const n = (v: number) => {
    const num = Number(v || 0);
    return num.toFixed(2);
  };

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
                Exporta todos os cenários cadastrados com cargos, quantidades e valores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={exportScenariosCsv} disabled={exporting || cargosData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Exportando...' : 'Exportar Cenários (CSV)'}
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
