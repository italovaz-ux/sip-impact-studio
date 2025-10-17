import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Removido Textarea pois o campo Descrição não será mais usado no diálogo de criação
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, FileText, Trash2, ArrowLeft, GitCompare, SlidersHorizontal, CheckCircle2 } from "lucide-react";
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

type Step = "selecionar" | "quantidades" | "impacto";

interface ScenarioItem {
  cargoId: string;
  quantidade: number;
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

const Cenarios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cenarios, setCenarios] = useState<Cenario[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    data_base: new Date().toISOString().split("T")[0],
  });
  // Campos adicionais para criação rápida de cenário
  const [newCargoId, setNewCargoId] = useState<string | null>(null);
  const [newQuantidade, setNewQuantidade] = useState<number>(1);
  const [newScenarioItems, setNewScenarioItems] = useState<ScenarioItem[]>([]);

  const addCargoToNewScenario = () => {
    if (!newCargoId || !newQuantidade || newQuantidade <= 0) return;
    setNewScenarioItems(prev => {
      const idx = prev.findIndex(i => i.cargoId === newCargoId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { cargoId: newCargoId, quantidade: (next[idx].quantidade || 0) + Number(newQuantidade) };
        return next;
      }
      return [...prev, { cargoId: newCargoId, quantidade: Number(newQuantidade) }];
    });
    setNewCargoId(null);
    setNewQuantidade(1);
  };

  const removeCargoFromNewScenario = (cargoId: string) => {
    setNewScenarioItems(prev => prev.filter(i => i.cargoId !== cargoId));
  };

  // Configuração de Cenário (passo a passo)
  const [cargosData, setCargosData] = useState<CargoWithParams[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [activeScenarioName, setActiveScenarioName] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<Step>("selecionar");
  const [groupFilter, setGroupFilter] = useState<string>("MEMBRO");
  const [selectedCargoIds, setSelectedCargoIds] = useState<Set<string>>(new Set());
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [compareA, setCompareA] = useState<string | undefined>();
  const [compareB, setCompareB] = useState<string | undefined>();
  const [compareTotals, setCompareTotals] = useState<{ a: { mensal: number; anual: number } | null; b: { mensal: number; anual: number } | null }>({ a: null, b: null });
  const [csvMap, setCsvMap] = useState<Record<string, CsvRow>>({});
  const [csvNormMap, setCsvNormMap] = useState<Record<string, CsvRow>>({});

  // Funções auxiliares para CSV
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
      Object.keys(map).forEach((label) => {
        norm[normalizeLabel(label)] = map[label];
      });
      setCsvNormMap(norm);
      return map;
    } catch (error) {
      console.error('Erro ao carregar calculos.csv:', error);
      return {};
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadCsvCalculations();
      await loadCenarios();
      await loadCargosData();
    };
    init();
  }, []);

  useEffect(() => {
    const loadComparisons = async () => {
      if (compareA && compareB) {
        const [totalsA, totalsB] = await Promise.all([
          computeTotalsForScenario(compareA),
          computeTotalsForScenario(compareB)
        ]);
        setCompareTotals({ a: totalsA, b: totalsB });
      } else {
        setCompareTotals({ a: null, b: null });
      }
    };
    loadComparisons();
  }, [compareA, compareB, cargosData, csvMap, csvNormMap]);

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
      if (m) {
        return `CC-${m[1]}`;
      }
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
    } catch (error) {
      console.error("Erro ao carregar dados dos cargos:", error);
    }
  };

  const calculateValues = (cargo: CargoWithParams) => {
    const baseMensal = cargo.base_mensal;
    const auxSaude = cargo.auxilio_saude || 0;
    const auxAlimentacao = cargo.auxilio_alimentacao || 0;
    const acervo = cargo.aplica_acervo ? 800 : 0;

    let aliqPatronal = 0;
    let decimoTerceiro = 0;
    let ferias = 0;

    if (cargo.grupo === "MEMBRO") {
      aliqPatronal = baseMensal * cargo.aliquota_patronal;
      decimoTerceiro = baseMensal + (baseMensal * cargo.aliquota_patronal);
      ferias = baseMensal + (baseMensal / 3);
    } else if (cargo.grupo === "EFETIVO") {
      aliqPatronal = baseMensal * cargo.aliquota_patronal;
      decimoTerceiro = baseMensal + (baseMensal * cargo.aliquota_patronal);
      ferias = baseMensal + (baseMensal / 3);
    } else if (cargo.grupo === "COMISSIONADO") {
      aliqPatronal = baseMensal * cargo.aliquota_patronal;
      decimoTerceiro = baseMensal + (baseMensal * cargo.aliquota_patronal);
      ferias = baseMensal + (baseMensal / 3) + ((baseMensal + (baseMensal / 3)) * cargo.aliquota_patronal);
    } else if (cargo.grupo === "ESTAGIARIO") {
      decimoTerceiro = 0;
      ferias = 0;
    }

    const mensal = baseMensal + aliqPatronal + (cargo.grupo === 'ESTAGIARIO' ? 0 : auxSaude) + (cargo.grupo === 'ESTAGIARIO' ? 0 : auxAlimentacao) + (cargo.grupo === 'ESTAGIARIO' ? 0 : acervo) + (cargo.grupo === 'ESTAGIARIO' ? (cargo.auxilio_transporte || 176.00) : 0);

    let anual = 0;
    if (cargo.grupo === "ESTAGIARIO") {
      anual = 12 * (baseMensal + (cargo.auxilio_transporte || 176.00));
    } else {
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

  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const loadScenarioItems = async (id: string): Promise<ScenarioItem[]> => {
    try {
      const { data, error } = await supabase
        .from("cenario_cargos")
        .select("cargo_id, quantidade")
        .eq("cenario_id", id);

      if (error) {
        console.error("Erro ao carregar itens do cenário:", error);
        return [];
      }

      return (data || []).map(item => ({
        cargoId: item.cargo_id,
        quantidade: item.quantidade
      }));
    } catch (err) {
      console.error("Erro ao carregar itens:", err);
      return [];
    }
  };

  const saveScenarioItems = async (id: string, items: ScenarioItem[]) => {
    try {
      // Primeiro, remove todos os itens existentes do cenário
      await supabase
        .from("cenario_cargos")
        .delete()
        .eq("cenario_id", id);

      // Depois, insere os novos itens
      if (items.length > 0) {
        const { error } = await supabase
          .from("cenario_cargos")
          .insert(items.map(item => ({
            cenario_id: id,
            cargo_id: item.cargoId,
            quantidade: item.quantidade
          })));

        if (error) {
          console.error("Erro ao salvar itens:", error);
          throw error;
        }
      }
    } catch (err) {
      console.error("Erro ao salvar itens do cenário:", err);
      throw err;
    }
  };

  const openConfigure = async (cenario: Cenario) => {
    setActiveScenarioId(cenario.id);
    setActiveScenarioName(cenario.nome);
    setCurrentStep("impacto");
    const items = await loadScenarioItems(cenario.id);
    const ids = new Set(items.map(i => i.cargoId));
    setSelectedCargoIds(ids);
    const qty: Record<string, number> = {};
    items.forEach(i => { qty[i.cargoId] = i.quantidade; });
    setQuantidades(qty);
  };

  const filteredCargos = cargosData.filter((c) => c.grupo === groupFilter);
  if (groupFilter === 'MEMBRO') {
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

  const selectedCargos = cargosData.filter(c => selectedCargoIds.has(c.id));

  const saveCurrentScenarioItems = async () => {
    if (!activeScenarioId) return;
    const items: ScenarioItem[] = selectedCargos.map(c => ({ cargoId: c.id, quantidade: Number(quantidades[c.id] || 0) }));
    try {
      await saveScenarioItems(activeScenarioId, items);
      toast({ title: "Itens do cenário salvos", description: "As quantidades foram salvas no banco de dados." });
    } catch (err) {
      toast({ 
        variant: "destructive",
        title: "Erro ao salvar", 
        description: "Não foi possível salvar os itens do cenário." 
      });
    }
  };

  const computeTotalsFromCsv = () => {
    let mensal = 0;
    let anual = 0;
    selectedCargos.forEach(cargo => {
      const label = labelForCargo(cargo);
      const csv = csvNormMap[normalizeLabel(label)] || csvMap[label];
      const qty = Number(quantidades[cargo.id] || 0);
      mensal += (csv?.mensal ?? 0) * qty;
      anual += (csv?.anual ?? 0) * qty;
    });
    return { mensal, anual };
  };

  const computeTotalsForScenario = async (scenarioId: string) => {
    const items = await loadScenarioItems(scenarioId);
    let mensal = 0;
    let anual = 0;
    items.forEach(item => {
      const cargo = cargosData.find(c => c.id === item.cargoId);
      if (!cargo) return;
      const label = labelForCargo(cargo);
      const csv = csvNormMap[normalizeLabel(label)] || csvMap[label];
      const qty = item.quantidade;
      mensal += (csv?.mensal ?? 0) * qty;
      anual += (csv?.anual ?? 0) * qty;
    });
    return { mensal, anual };
  };

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase
        .from("cenarios")
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Cenário criado",
        description: "O cenário foi criado com sucesso.",
      });

      // Se existem itens adicionados, salvar todos e abrir configuração em 'impacto'
      if (data?.id && newScenarioItems.length > 0) {
        const aggregated: Record<string, number> = {};
        newScenarioItems.forEach(i => {
          aggregated[i.cargoId] = (aggregated[i.cargoId] || 0) + Number(i.quantidade || 0);
        });
        const itemsToSave: ScenarioItem[] = Object.entries(aggregated).map(([cargoId, quantidade]) => ({ cargoId, quantidade }));
        await saveScenarioItems(data.id, itemsToSave);
        setActiveScenarioId(data.id);
        setActiveScenarioName(formData.nome);
        setSelectedCargoIds(new Set(itemsToSave.map(i => i.cargoId)));
        const qtyMap: Record<string, number> = {};
        itemsToSave.forEach(i => { qtyMap[i.cargoId] = i.quantidade; });
        setQuantidades(qtyMap);
        setCurrentStep('impacto');
      }

      setIsDialogOpen(false);
      setFormData({
        nome: "",
        descricao: "",
        data_base: new Date().toISOString().split("T")[0],
      });
      setNewCargoId(null);
      setNewQuantidade(1);
      setNewScenarioItems([]);
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
          <div className="flex gap-2">
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
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
                  Informe o nome, adicione cargos e quantidades
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
                  <Label>Cargos</Label>
                  <Select value={newCargoId || ''} onValueChange={(v) => setNewCargoId(v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um cargo" /></SelectTrigger>
                    <SelectContent>
                      {cargosData.map(c => (
                        <SelectItem key={c.id} value={c.id}>{labelForCargo(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min={1}
                    value={newQuantidade}
                    onChange={(e) => setNewQuantidade(Number(e.target.value))}
                  />
                </div>
                {newScenarioItems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Itens adicionados</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cargo</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newScenarioItems.map((item) => {
                          const cargo = cargosData.find(c => c.id === item.cargoId);
                          return (
                            <TableRow key={item.cargoId} className="odd:bg-muted/30">
                              <TableCell className="font-medium">{cargo ? labelForCargo(cargo) : item.cargoId}</TableCell>
                              <TableCell className="text-right">{item.quantidade}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeCargoFromNewScenario(item.cargoId)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="secondary" onClick={addCargoToNewScenario} disabled={!newCargoId || !newQuantidade || newQuantidade <= 0}>
                  Adicionar Cargo
                </Button>
                <Button onClick={handleCreate} disabled={!formData.nome || newScenarioItems.length === 0}>
                  Criar Cenário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>


        {cenarios.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum cenário criado ainda</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cenário
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
                    <TableHead className="font-bold">Nome</TableHead>
                    <TableHead className="font-bold">Descrição</TableHead>
                    <TableHead className="font-bold">Data Base</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-center font-bold">Ações</TableHead>
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
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfigure(cenario)}
                          >
                            <SlidersHorizontal className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(cenario.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeScenarioId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" /> Impacto</CardTitle>
              <CardDescription>Selecione cargos, defina quantidades e veja o impacto total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={currentStep === 'selecionar' ? 'font-semibold text-foreground' : ''}>1. Selecionar cargos</span>
                  <span>•</span>
                  <span className={currentStep === 'quantidades' ? 'font-semibold text-foreground' : ''}>2. Definir quantidades</span>
                  <span>•</span>
                  <span className={currentStep === 'impacto' ? 'font-semibold text-foreground' : ''}>3. Ver impacto total</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setActiveScenarioId(null); setSelectedCargoIds(new Set()); setQuantidades({}); }}>Fechar</Button>
                </div>
              </div>

              {currentStep === 'selecionar' && (
                <div className="space-y-4">
                  <Tabs value={groupFilter} onValueChange={setGroupFilter}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="MEMBRO">Membros</TabsTrigger>
                      <TabsTrigger value="EFETIVO">Efetivos</TabsTrigger>
                      <TabsTrigger value="COMISSIONADO">Comissionados</TabsTrigger>
                      <TabsTrigger value="ESTAGIARIO">Estagiários</TabsTrigger>
                    </TabsList>
                    <TabsContent value={groupFilter} className="mt-4">
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="lg:sticky lg:left-0 lg:z-10 lg:bg-background font-bold">Cargo</TableHead>
                              <TableHead className="text-right font-bold">Selecionar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCargos.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">Nenhum cargo neste grupo</TableCell>
                              </TableRow>
                            ) : (
                              filteredCargos.map((cargo) => (
                                <TableRow key={cargo.id} className="odd:bg-muted/30">
                                  <TableCell className="font-bold lg:sticky lg:left-0 lg:z-10 lg:bg-background">{labelForCargo(cargo)}</TableCell>
                                  <TableCell className="text-right">
                                    <Checkbox
                                      checked={selectedCargoIds.has(cargo.id)}
                                      onCheckedChange={(checked) => {
                                        const next = new Set(selectedCargoIds);
                                        if (checked) next.add(cargo.id); else next.delete(cargo.id);
                                        setSelectedCargoIds(next);
                                        if (checked && quantidades[cargo.id] === undefined) {
                                          setQuantidades(prev => ({ ...prev, [cargo.id]: 1 }));
                                        }
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <div className="flex w-full justify-end gap-2">
                    <Button variant="default" disabled={selectedCargoIds.size === 0} onClick={() => setCurrentStep('quantidades')}>Prosseguir</Button>
                  </div>
                </div>
              )}

              {currentStep === 'quantidades' && (
                <div className="space-y-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="lg:sticky lg:left-0 lg:z-10 lg:bg-background font-bold">Cargo</TableHead>
                          <TableHead className="text-right font-bold">Quantidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCargos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">Nenhum cargo selecionado</TableCell>
                          </TableRow>
                        ) : (
                          selectedCargos.map(cargo => (
                            <TableRow key={cargo.id} className="odd:bg-muted/30">
                              <TableCell className="font-bold lg:sticky lg:left-0 lg:z-10 lg:bg-background">{labelForCargo(cargo)}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min={0}
                                  value={quantidades[cargo.id] ?? 0}
                                  onChange={(e) => setQuantidades(prev => ({ ...prev, [cargo.id]: Number(e.target.value) }))}
                                  className="w-24 text-right"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex w-full justify-end gap-2">
                    <Button variant="outline" onClick={() => setCurrentStep('selecionar')}>Voltar</Button>
                    <Button variant="secondary" onClick={saveCurrentScenarioItems}>Salvar Itens</Button>
                    <Button variant="default" onClick={() => { saveCurrentScenarioItems(); setCurrentStep('impacto'); }}>Prosseguir</Button>
                  </div>
                </div>
              )}

              {currentStep === 'impacto' && (
                <div className="space-y-6">

                  {/* Tabela de valores por cargo selecionado (multiplicado pela quantidade) */}
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">Cargo</TableHead>
                          <TableHead className="font-bold text-right">Quantidade</TableHead>
                          <TableHead className="font-bold text-right">Valor Mensal</TableHead>
                          <TableHead className="font-bold text-right">Valor Anual</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCargos.map(cargo => {
                          const label = labelForCargo(cargo);
                          const csv = csvNormMap[normalizeLabel(label)] || csvMap[label];
                          const qty = Number(quantidades[cargo.id] || 0);
                          const mensal = (csv?.mensal ?? 0) * qty;
                          const anual = (csv?.anual ?? 0) * qty;
                          return (
                            <TableRow key={cargo.id} className="odd:bg-muted/30">
                              <TableCell className="font-medium">{labelForCargo(cargo)}</TableCell>
                              <TableCell className="text-right">{qty}</TableCell>
                              <TableCell className="text-right">R$ {formatCurrency(mensal)}</TableCell>
                              <TableCell className="text-right font-semibold">R$ {formatCurrency(anual)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {(() => { const t = computeTotalsFromCsv(); return (
                    <div className="flex justify-end">
                      <div className="text-right space-y-1">
                        <div><span className="mr-2">Total Mensal:</span><span className="font-semibold">R$ {formatCurrency(t.mensal)}</span></div>
                        <div><span className="mr-2">Total Anual:</span><span className="font-bold">R$ {formatCurrency(t.anual)}</span></div>
                      </div>
                    </div>
                  ); })()}

                  <div className="flex w-full justify-end gap-2">
                    <Button variant="outline" onClick={() => setCurrentStep('quantidades')}>Voltar</Button>
                    <Button variant="default" onClick={() => { saveScenarioItems(activeScenarioId!, selectedCargos.map(c => ({ cargoId: c.id, quantidade: Number(quantidades[c.id] || 0) })) ); toast({ title: 'Cenário atualizado', description: 'Configuração salva.' }); }}>Salvar</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GitCompare className="h-5 w-5" /> Comparar Cenários</CardTitle>
            <CardDescription>Selecione dois cenários para comparar lado a lado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label>Cenário A</Label>
                <Select value={compareA || ''} onValueChange={(v) => setCompareA(v || null)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o Cenário A" /></SelectTrigger>
                  <SelectContent>
                    {cenarios.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cenário B</Label>
                <Select value={compareB || ''} onValueChange={(v) => setCompareB(v || null)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o Cenário B" /></SelectTrigger>
                  <SelectContent>
                    {cenarios.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setCompareA(null); setCompareB(null); }}>Limpar</Button>
                <Button variant="default" disabled={!compareA || !compareB} onClick={() => toast({ title: 'Comparação pronta', description: 'Veja os totais abaixo.' })}>Comparar</Button>
              </div>
            </div>

            {compareA && compareB && compareTotals.a && compareTotals.b && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const a = compareTotals.a;
                  const b = compareTotals.b;
                  const deltaM = b.mensal - a.mensal;
                  const deltaA = b.anual - a.anual;
                  return (
                    <>
                      <Card className="bg-muted/30">
                        <CardHeader>
                          <CardTitle className="text-lg">Cenário A</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span>Mensal</span><span className="font-semibold">R$ {formatCurrency(a.mensal)}</span></div>
                            <div className="flex justify-between"><span>Anual</span><span className="font-bold">R$ {formatCurrency(a.anual)}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardHeader>
                          <CardTitle className="text-lg">Cenário B</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span>Mensal</span><span className="font-semibold">R$ {formatCurrency(b.mensal)}</span></div>
                            <div className="flex justify-between"><span>Anual</span><span className="font-bold">R$ {formatCurrency(b.anual)}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardHeader>
                          <CardTitle className="text-lg">Diferença (B - A)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span>Mensal</span><span className="font-semibold">R$ {formatCurrency(deltaM)}</span></div>
                            <div className="flex justify-between"><span>Anual</span><span className="font-bold">R$ {formatCurrency(deltaA)}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Cenarios;
