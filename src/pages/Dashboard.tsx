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
  const [csvMap, setCsvMap] = useState<Record<string, CsvRow>>({});

  useEffect(() => {
    const init = async () => {
      const map = await loadCsvCalculations();
      await loadStats();
      await loadCargosData(map);
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
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === ',' && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map((c) => c.trim());
  };

  const loadCsvCalculations = async (): Promise<Record<string, CsvRow>> => {
    try {
      const res = await fetch('/calculos.csv');
      const text = await res.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const map: Record<string, CsvRow> = {};
      for (const line of lines) {
        const cells = splitCsvLine(line);
        // Ignorar cabeçalhos (linhas que começam com célula vazia)
        if (!cells[0] || cells[0].length === 0) continue;
        const label = cells[0];
        // Pular se não houver colunas suficientes
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
      return cargo.nome;
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

  const loadCargosData = async (csvData?: Record<string, CsvRow>) => {
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
      const formatted = data?.map((cargo: any) => {
        const label = labelForCargo(cargo);
        const localMap = csvData || csvMap;
        const csv = localMap[label];
        const base = csv?.base ?? cargo.parametros_cargo?.[0]?.base_mensal ?? 0;
        const contribValor = csv?.contrib ?? 0;
        const aliquotaRate = base > 0 ? contribValor / base : (cargo.parametros_cargo?.[0]?.aliquota_patronal ?? 0);
        const auxSaudeOuTransporte = csv?.aux ?? 0;
        const auxAlim = csv?.alimentacao ?? cargo.parametros_cargo?.[0]?.auxilio_alimentacao ?? 0;
        const acervoVal = csv?.acervo ?? (cargo.parametros_cargo?.[0]?.aplica_acervo ? 1 : 0);

        const isEstagiario = cargo.grupo === 'ESTAGIARIO';

        return {
          id: cargo.id,
          nome: cargo.nome,
          classe: cargo.classe,
          grupo: cargo.grupo,
          base_mensal: base,
          aliquota_patronal: aliquotaRate,
          auxilio_saude: isEstagiario ? 0 : auxSaudeOuTransporte,
          auxilio_alimentacao: auxAlim,
          auxilio_transporte: isEstagiario ? auxSaudeOuTransporte : (cargo.parametros_cargo?.[0]?.auxilio_transporte ?? 0),
          aplica_acervo: (csv?.acervo ?? 0) > 0,
        } as CargoWithParams;
      }) || [];

      setCargosData(formatted);
    } catch (error) {
      console.error("Erro ao carregar dados dos cargos:", error);
    }
  };

  const calculateValues = (cargo: CargoWithParams) => {
    const baseMensal = cargo.base_mensal;
    let aliqPatronal = 0;
    let auxSaude = cargo.auxilio_saude || 0;
    const auxAlimentacao = cargo.auxilio_alimentacao || 0;
    let acervo = 0;
    let decimoTerceiro = 0;
    let ferias = 0;
    // Se existir linha no CSV para este cargo, usar diretamente os valores do CSV
    const label = labelForCargo(cargo);
    const csv = csvMap[label];
    if (csv) {
      aliqPatronal = csv.contrib;
      acervo = csv.acervo;
      const mensal = csv.mensal;
      decimoTerceiro = csv.decimo;
      ferias = csv.ferias;
      const anual = csv.anual;
      return {
        mensal,
        decimoTerceiro,
        ferias,
        anual,
        aliqPatronal,
        acervo,
      };
    }
    
    // Cálculos específicos por grupo
    if (cargo.grupo === "MEMBRO") {
      // Contribuição Patronal: 28% sobre o subsídio (base mensal) (inclusive 13º, exceto férias)
      aliqPatronal = baseMensal * cargo.aliquota_patronal;
      
      // Auxílio-Saúde: 10% do subsídio
      auxSaude = baseMensal * 0.10;
      
      // Gratificação de Acervo: (subsídio ÷ 30) × 7
      acervo = cargo.aplica_acervo ? (baseMensal / 30) * 7 : 0;
      
      // 13º (com CP)
      decimoTerceiro = baseMensal + (baseMensal * cargo.aliquota_patronal);
      
      // Férias + 2/3 (sem CP)
      ferias = baseMensal + (baseMensal * 2/3);
      
    } else if (cargo.grupo === "EFETIVO") {
      // Contribuição Patronal: 28% sobre o vencimento (inclusive 13º, exceto férias)
      aliqPatronal = baseMensal * cargo.aliquota_patronal;
      
      // 13º (com CP)
      decimoTerceiro = baseMensal + (baseMensal * cargo.aliquota_patronal);
      
      // Férias + 1/3 (sem CP)
      ferias = baseMensal + (baseMensal / 3);
      
    } else if (cargo.grupo === "COMISSIONADO") {
      // Contribuição Patronal: 21% sobre o vencimento (inclusive 13º e férias)
      aliqPatronal = baseMensal * cargo.aliquota_patronal;
      
      // 13º (com CP)
      decimoTerceiro = baseMensal + (baseMensal * cargo.aliquota_patronal);
      
      // Férias + 1/3 (com CP)
      ferias = baseMensal + (baseMensal / 3) + ((baseMensal + (baseMensal / 3)) * cargo.aliquota_patronal);
      
    } else if (cargo.grupo === "ESTAGIARIO") {
      // Sem contribuição patronal, sem auxílios saúde/alimentação
      // Custo Anual: 12 × (Bolsa + 176,00)
      // Não tem 13º nem férias
      decimoTerceiro = 0;
      ferias = 0;
    }
    
    const mensal = baseMensal + aliqPatronal + auxSaude + auxAlimentacao + acervo;
    
    // Cálculo do custo anual
    let anual = 0;
    if (cargo.grupo === "ESTAGIARIO") {
      // Para estagiários: 12 × (Bolsa + Auxílio Transporte)
      anual = 12 * (baseMensal + 176.00);
    } else {
      // Para os demais: (mensal * 12) + 13º + férias
      anual = (mensal * 12) + decimoTerceiro + ferias;
    }

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
  // Ordenação específica para Membros na ordem solicitada
  if (selectedGroup === 'MEMBRO') {
    const ordem = [
      'Procurador de Justiça',
      'Promotor de Entrância Final',
      'Promotor de Entrância Intermediária',
      'Promotor de Entrância Inicial',
      'Promotor Substituto',
    ];
    const posicao = (c: CargoWithParams) => {
      const label = labelForCargo(c);
      const idx = ordem.indexOf(label);
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };
    filteredCargos.sort((a, b) => posicao(a) - posicao(b));
  }
  const totalAnualGrupo = filteredCargos.reduce((sum, cargo) => {
    return sum + calculateValues(cargo).anual;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Seção de cards removida conforme solicitação

  const buildCsv = () => {
    const hasAcervo = filteredCargos.some((c) => c.aplica_acervo);
    const headers = [
      'Cargo',
      'Base Mensal',
      'Aliq Patronal',
      ...(selectedGroup !== 'ESTAGIARIO' ? ['Aux Saúde', 'Aux Alimentação'] : ['Aux Transporte']),
      ...(hasAcervo ? ['Acervo'] : []),
      'Mensal',
      ...(selectedGroup !== 'ESTAGIARIO' ? ['13º', 'Férias'] : []),
      'Anual',
    ];
    const rows = filteredCargos.map((cargo) => {
      const calc = calculateValues(cargo);
      const base = `R$ ${formatCurrency(cargo.base_mensal)}`;
      const patronal = `R$ ${formatCurrency(calc.aliqPatronal)}`;
      const auxSaude = selectedGroup !== 'ESTAGIARIO' ? `R$ ${formatCurrency(cargo.auxilio_saude)}` : undefined;
      const auxAlimentacao = selectedGroup !== 'ESTAGIARIO' ? `R$ ${formatCurrency(cargo.auxilio_alimentacao)}` : undefined;
      const auxTransporte = selectedGroup === 'ESTAGIARIO' ? `R$ ${formatCurrency(cargo.auxilio_transporte ?? 176.00)}` : undefined;
      const acervo = hasAcervo ? `R$ ${formatCurrency(calc.acervo)}` : undefined;
      const mensal = `R$ ${formatCurrency(calc.mensal)}`;
      const decimo = selectedGroup !== 'ESTAGIARIO' ? `R$ ${formatCurrency(calc.decimoTerceiro)}` : undefined;
      const ferias = selectedGroup !== 'ESTAGIARIO' ? `R$ ${formatCurrency(calc.ferias)}` : undefined;
      const anual = `R$ ${formatCurrency(calc.anual)}`;
      const label = labelForCargo(cargo);
      const cols = [label, base, patronal];
      if (selectedGroup !== 'ESTAGIARIO') {
        cols.push(auxSaude!, auxAlimentacao!);
      } else {
        cols.push(auxTransporte!);
      }
      if (hasAcervo) cols.push(acervo!);
      cols.push(mensal);
      if (selectedGroup !== 'ESTAGIARIO') {
        cols.push(decimo!, ferias!);
      }
      cols.push(anual);
      return cols.map((v) => `"${v}"`).join(',');
    });
    const totalRow = [
      'TOTAL ANUAL DO GRUPO',
      ...Array(headers.length - 2).fill(''),
      `"R$ ${formatCurrency(totalAnualGrupo)}"`,
    ].join(',');
    return [headers.join(','), ...rows, totalRow].join('\n');
  };

  const handleExportCSV = () => {
    try {
      const csv = buildCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `parametros_${selectedGroup.toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao exportar CSV:', e);
    }
  };

  const handleExportPDF = () => {
    try {
      const tableEl = document.getElementById('parametros-table');
      const totalEl = document.getElementById('total-anual-grupo');
      const printWin = window.open('', '_blank');
      if (!printWin || !tableEl) return;
      const style = `
        <style>
          body { font-family: Inter, ui-sans-serif, system-ui, -apple-system; padding: 16px; }
          h1 { font-size: 18px; margin: 0 0 12px; }
          .total { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #3b82f680; background: #3b82f61a; color: #1e40af; border-radius: 8px; margin-top: 12px; }
          .total .value { font-weight: 700; font-size: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          thead th { text-align: right; padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280; }
          thead th:first-child, tbody td:first-child { text-align: left; position: sticky; left: 0; background: white; }
          tbody td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
          tbody tr:nth-child(odd) { background: #f8fafc; }
          tbody td:not(:first-child) { text-align: right; }
        </style>
      `;
      const totalHtml = totalEl ? totalEl.outerHTML : '';
      printWin.document.write(`<html><head><title>Parâmetros por Grupo</title>${style}</head><body>`);
      printWin.document.write(`<h1>Parâmetros por Grupo (${selectedGroup})</h1>`);
      printWin.document.write(tableEl.outerHTML);
      printWin.document.write(totalHtml);
      printWin.document.write('</body></html>');
      printWin.document.close();
      printWin.focus();
      printWin.print();
      printWin.close();
    } catch (e) {
      console.error('Erro ao exportar PDF:', e);
      window.print();
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema de cálculo de impacto de pessoal
          </p>
        </div>

        {/* Cards de resumo removidos */}

        {/* Cards de gestão removidos; navegação mantida no menu lateral */}

        <Card>
          <CardHeader>
            <CardTitle>Parâmetros por Grupo</CardTitle>
            <CardDescription>
              Visualize os cálculos detalhados de cada cargo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Ações de exportação */}
            <div className="flex w-full justify-end gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>Exportar CSV</Button>
              <Button variant="default" size="sm" onClick={handleExportPDF}>Exportar PDF</Button>
            </div>
            <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="MEMBRO">Membros do MP</TabsTrigger>
                <TabsTrigger value="EFETIVO">Servidores Efetivos</TabsTrigger>
                <TabsTrigger value="COMISSIONADO">Comissionados</TabsTrigger>
                <TabsTrigger value="ESTAGIARIO">Estagiários</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedGroup} className="mt-6">
                <div id="parametros-table" className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="lg:sticky lg:left-0 lg:z-10 lg:bg-background font-bold text-foreground">Cargo</TableHead>
                        <TableHead className="text-right font-bold text-foreground">Base Mensal</TableHead>
                        <TableHead className="text-right font-bold text-foreground">Aliq Patronal</TableHead>
                        {selectedGroup !== "ESTAGIARIO" && (
                          <TableHead className="text-right font-bold text-foreground">Aux Saúde</TableHead>
                        )}
                        {selectedGroup !== "ESTAGIARIO" && (
                          <TableHead className="text-right font-bold text-foreground">Aux Alimentação</TableHead>
                        )}
                        {selectedGroup === "ESTAGIARIO" && (
                          <TableHead className="text-right font-bold text-foreground">Aux Transporte</TableHead>
                        )}
                        {filteredCargos.some((c) => c.aplica_acervo) && (
                          <TableHead className="text-right font-bold text-foreground">Acervo</TableHead>
                        )}
                        <TableHead className="text-right font-bold text-foreground">Mensal</TableHead>
                        {selectedGroup !== "ESTAGIARIO" && (
                          <TableHead className="text-right font-bold text-foreground">13º</TableHead>
                        )}
                        {selectedGroup !== "ESTAGIARIO" && (
                          <TableHead className="text-right font-bold text-foreground">Férias</TableHead>
                        )}
                        <TableHead className="text-right font-bold text-foreground">Anual</TableHead>
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
                              <TableRow key={cargo.id} className="odd:bg-muted/30">
                              <TableCell className="font-bold lg:sticky lg:left-0 lg:z-10 lg:bg-background">
                                {labelForCargo(cargo)}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(cargo.base_mensal)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(calc.aliqPatronal)}</TableCell>
                              {cargo.grupo !== "ESTAGIARIO" && (
                                <TableCell className="text-right">{formatCurrency(cargo.auxilio_saude)}</TableCell>
                              )}
                              {cargo.grupo !== "ESTAGIARIO" && (
                                <TableCell className="text-right">{formatCurrency(cargo.auxilio_alimentacao)}</TableCell>
                              )}
                              {cargo.grupo === "ESTAGIARIO" && (
                                <TableCell className="text-right">{formatCurrency(cargo.auxilio_transporte || 176.00)}</TableCell>
                              )}
                              {filteredCargos.some((c) => c.aplica_acervo) && (
                                <TableCell className="text-right">{formatCurrency(calc.acervo)}</TableCell>
                              )}
                              <TableCell className="text-right font-medium">{formatCurrency(calc.mensal)}</TableCell>
                              {cargo.grupo !== "ESTAGIARIO" && (
                                <TableCell className="text-right">{formatCurrency(calc.decimoTerceiro)}</TableCell>
                              )}
                              {cargo.grupo !== "ESTAGIARIO" && (
                                <TableCell className="text-right">{formatCurrency(calc.ferias)}</TableCell>
                              )}
                              <TableCell className="text-right font-bold">{formatCurrency(calc.anual)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                      {filteredCargos.length > 0 && null}
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
