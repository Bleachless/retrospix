import type { BancoId, Lancamento } from "../types";
import { classificar, type Categoria, type Classificado } from "./categorias";
import { comparar, type Comparacao } from "./comparacoes";
import { acharRecorrentes, type Recorrente } from "./recorrencia";

export type Pessoa = { nome: string; chave: string; total: number; vezes: number };
export type Lugar = { nome: string; total: number; vezes: number };
export type Bloco = { total: number; vezes: number; ticketMedio: number; top: Lugar[]; maior: { nome: string; valor: number; data: string } | null };

export type Retrospectiva = {
  periodo: { inicio: string; fim: string; dias: number; meses: number; ano: number | null };
  bancos: BancoId[];
  lancamentos: number;
  entradas: number;
  gastos: number;
  pix: {
    enviado: number;
    recebido: number;
    enviados: number;
    recebidos: number;
    paraQuem: Pessoa[];
    deQuem: Pessoa[];
    pessoasDiferentes: number;
    maiorEnviado: { nome: string; valor: number; data: string; pessoa: boolean } | null;
  };
  meses: { mes: string; gasto: number }[];
  mesMaisCaro: { mes: string; gasto: number } | null;
  diaMaisCaro: { data: string; gasto: number; vezes: number; principal: { nome: string; valor: number; pessoa: boolean } } | null;
  temHora: boolean;
  madrugada: { total: number; vezes: number; top: Lugar[]; horaMaisTarde: string | null } | null;
  semana: { fimDeSemana: number; diaUtil: number; mediaFimDeSemana: number; mediaDiaUtil: number; diaMaisCaro: number };
  delivery: Bloco;
  transporte: Bloco;
  assinaturas: { itens: Recorrente[]; mensal: number; anual: number; esquecidas: Recorrente[] };
  categorias: { categoria: Categoria; total: number }[];
  comparacoes: Comparacao[];
  persona: { titulo: string; frase: string };
  /** Quem a pessoa marcou como "sou eu" e saiu das contas. */
  ignorados: string[];
};

/** Quem mais aparece nos Pix, para a pessoa marcar se é ela mesma. */
export function candidatosAEu(lancamentos: Lancamento[], limite = 8): Pessoa[] {
  const mapa = new Map<string, Pessoa>();
  for (const l of lancamentos.map(classificar)) {
    if (l.contraparteTipo !== "pessoa" || !l.contraparte) continue;
    const p = mapa.get(l.chave) ?? { nome: l.contraparte, chave: l.chave, total: 0, vezes: 0 };
    p.total += Math.abs(l.valor);
    p.vezes++;
    mapa.set(l.chave, p);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total).slice(0, limite);
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function somarLugares(itens: Classificado[], limite = 3): Lugar[] {
  const mapa = new Map<string, Lugar>();
  for (const i of itens) {
    const k = i.chave || i.nome;
    const l = mapa.get(k) ?? { nome: i.nome, total: 0, vezes: 0 };
    l.total = r2(l.total + Math.abs(i.valor));
    l.vezes++;
    mapa.set(k, l);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total).slice(0, limite);
}

function bloco(itens: Classificado[]): Bloco {
  const total = r2(itens.reduce((s, i) => s + Math.abs(i.valor), 0));
  const maior = [...itens].sort((a, b) => a.valor - b.valor)[0];
  return {
    total,
    vezes: itens.length,
    ticketMedio: itens.length ? r2(total / itens.length) : 0,
    top: somarLugares(itens),
    maior: maior ? { nome: maior.nome, valor: Math.abs(maior.valor), data: maior.data } : null,
  };
}

function diaDaSemana(data: string): number {
  return new Date(`${data}T12:00:00Z`).getUTCDay();
}

export function calcular(
  brutos: Lancamento[],
  opcoes: { ignorar?: Iterable<string> } = {},
): Retrospectiva {
  const ignorar = new Set(opcoes.ignorar ?? []);
  const todos = brutos.map(classificar);
  const temCartao = todos.some((l) => l.origem === "cartao");

  const ehInterno = (l: Classificado) =>
    l.categoria === "investimento" ||
    (l.categoria === "fatura" && (temCartao || l.origem === "cartao")) ||
    ignorar.has(l.chave);

  const validos = todos.filter((l) => !ehInterno(l));
  const saidas = validos.filter((l) => l.valor < 0);
  const entradas = validos.filter((l) => l.valor > 0);

  const datas = todos.map((l) => l.data).sort();
  const inicio = datas[0] ?? "";
  const fim = datas[datas.length - 1] ?? "";
  const dias = inicio ? Math.round((Date.parse(fim) - Date.parse(inicio)) / 86_400_000) + 1 : 0;
  const anos = new Set(datas.map((d) => d.slice(0, 4)));
  const mesesSet = new Set(datas.map((d) => d.slice(0, 7)));

  // Pix
  const pixEnviados = saidas.filter((l) => l.pix);
  const pixRecebidos = entradas.filter((l) => l.pix);
  const pessoas = (itens: Classificado[]) => {
    const mapa = new Map<string, Pessoa>();
    for (const l of itens) {
      if (l.contraparteTipo !== "pessoa" || !l.contraparte) continue;
      const p = mapa.get(l.chave) ?? { nome: l.contraparte, chave: l.chave, total: 0, vezes: 0 };
      p.total = r2(p.total + Math.abs(l.valor));
      p.vezes++;
      mapa.set(l.chave, p);
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total);
  };
  const paraQuem = pessoas(pixEnviados);
  const deQuem = pessoas(pixRecebidos);
  const maiorPix = [...pixEnviados].sort((a, b) => a.valor - b.valor)[0];

  // Meses e dias
  const porMes = new Map<string, number>();
  const porDia = new Map<string, Classificado[]>();
  for (const l of saidas) {
    porMes.set(l.data.slice(0, 7), r2((porMes.get(l.data.slice(0, 7)) ?? 0) + Math.abs(l.valor)));
    porDia.set(l.data, [...(porDia.get(l.data) ?? []), l]);
  }
  const meses = [...mesesSet].sort().map((mes) => ({ mes, gasto: porMes.get(mes) ?? 0 }));
  const mesMaisCaro = meses.length ? [...meses].sort((a, b) => b.gasto - a.gasto)[0] : null;
  let diaMaisCaro: Retrospectiva["diaMaisCaro"] = null;
  for (const [data, itens] of porDia) {
    const gasto = r2(itens.reduce((s, i) => s + Math.abs(i.valor), 0));
    if (!diaMaisCaro || gasto > diaMaisCaro.gasto) {
      const p = [...itens].sort((a, b) => a.valor - b.valor)[0];
      diaMaisCaro = { data, gasto, vezes: itens.length, principal: { nome: p.nome, valor: Math.abs(p.valor), pessoa: p.contraparteTipo === "pessoa" } };
    }
  }

  // Horário: só dá para falar de madrugada se o extrato trouxer a hora.
  const temHora = todos.some((l) => l.hora && l.hora !== "00:00");
  let madrugada: Retrospectiva["madrugada"] = null;
  if (temHora) {
    const itens = saidas.filter((l) => l.hora && l.hora >= "00:00" && l.hora < "05:00" && l.hora !== "00:00");
    const maisTarde = [...itens].sort((a, b) => (b.hora ?? "").localeCompare(a.hora ?? ""))[0];
    madrugada = {
      total: r2(itens.reduce((s, i) => s + Math.abs(i.valor), 0)),
      vezes: itens.length,
      // Pix para pessoas conta no total, mas nome de gente não vai para o card.
      top: somarLugares(itens.filter((i) => i.contraparteTipo !== "pessoa")),
      horaMaisTarde: maisTarde?.hora ?? null,
    };
  }
  const somaSemana = [0, 0, 0, 0, 0, 0, 0];
  for (const l of saidas) somaSemana[diaDaSemana(l.data)] += Math.abs(l.valor);
  const contarDias = (filtro: (d: number) => boolean) => {
    if (!inicio) return 0;
    let n = 0;
    for (let t = Date.parse(inicio); t <= Date.parse(fim); t += 86_400_000) {
      if (filtro(new Date(t).getUTCDay())) n++;
    }
    return n;
  };
  const fds = r2(somaSemana[0] + somaSemana[6]);
  const util = r2(somaSemana.slice(1, 6).reduce((s, v) => s + v, 0));
  const diasFds = contarDias((d) => d === 0 || d === 6);
  const diasUteis = contarDias((d) => d > 0 && d < 6);

  // Categorias
  const porCategoria = new Map<Categoria, number>();
  for (const l of saidas) porCategoria.set(l.categoria, r2((porCategoria.get(l.categoria) ?? 0) + Math.abs(l.valor)));
  const categorias = [...porCategoria.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);

  const delivery = bloco(saidas.filter((l) => l.categoria === "delivery"));
  const transporte = bloco(saidas.filter((l) => l.categoria === "transporte"));
  const recorrentes = acharRecorrentes(validos);
  const mensal = r2(recorrentes.reduce((s, r) => s + r.valor, 0));

  const gastos = r2(saidas.reduce((s, l) => s + Math.abs(l.valor), 0));
  const enviado = r2(pixEnviados.reduce((s, l) => s + Math.abs(l.valor), 0));

  const comparacoes = [
    comparar("Seu delivery", delivery.total, ["aluguel", "cesta", "rodizio", "coxinha"]),
    comparar("Seus apps de transporte", transporte.total, ["gasolina", "onibus"]),
    comparar("Suas assinaturas, em um ano", r2(mensal * 12), ["cesta", "botijao", "rodizio", "cafezinho"]),
    comparar("Seus Pix enviados", enviado, ["aluguel", "cesta", "coxinha"]),
  ].filter((c): c is Comparacao => c !== null);

  const retro: Retrospectiva = {
    periodo: { inicio, fim, dias, meses: mesesSet.size, ano: anos.size === 1 ? Number([...anos][0]) : null },
    bancos: [...new Set(todos.map((l) => l.banco))],
    lancamentos: validos.length,
    entradas: r2(entradas.reduce((s, l) => s + l.valor, 0)),
    gastos,
    pix: {
      enviado,
      recebido: r2(pixRecebidos.reduce((s, l) => s + l.valor, 0)),
      enviados: pixEnviados.length,
      recebidos: pixRecebidos.length,
      paraQuem: paraQuem.slice(0, 5),
      deQuem: deQuem.slice(0, 5),
      pessoasDiferentes: new Set([...paraQuem, ...deQuem].map((p) => p.chave)).size,
      maiorEnviado: maiorPix
        ? { nome: maiorPix.nome, valor: Math.abs(maiorPix.valor), data: maiorPix.data, pessoa: maiorPix.contraparteTipo === "pessoa" }
        : null,
    },
    meses,
    mesMaisCaro,
    diaMaisCaro,
    temHora,
    madrugada,
    semana: {
      fimDeSemana: fds,
      diaUtil: util,
      mediaFimDeSemana: diasFds ? r2(fds / diasFds) : 0,
      mediaDiaUtil: diasUteis ? r2(util / diasUteis) : 0,
      diaMaisCaro: somaSemana.indexOf(Math.max(...somaSemana)),
    },
    delivery,
    transporte,
    assinaturas: { itens: recorrentes, mensal, anual: r2(mensal * 12), esquecidas: recorrentes.filter((r) => r.esquecida) },
    categorias,
    comparacoes,
    persona: { titulo: "", frase: "" },
    ignorados: [...ignorar],
  };
  retro.persona = escolherPersona(retro);
  return retro;
}

/** A "persona financeira" do card final, escolhida pelo que mais pesa. */
export function escolherPersona(r: Retrospectiva): { titulo: string; frase: string } {
  const g = r.gastos || 1;
  const parte = (c: Categoria) => (r.categorias.find((x) => x.categoria === c)?.total ?? 0) / g;
  const pixPorDia = r.periodo.dias ? (r.pix.enviados + r.pix.recebidos) / r.periodo.dias : 0;
  const opcoes: { pontos: number; titulo: string; frase: string }[] = [
    { pontos: parte("delivery") / 0.1, titulo: "Mestre do delivery", frase: "A sua cozinha é só decoração." },
    { pontos: parte("transporte") / 0.07, titulo: "Primeira classe do app", frase: "Motorista particular? Você tem vários." },
    { pontos: r.assinaturas.itens.length / 5, titulo: "Acervo de assinaturas", frase: "Se existe um plano mensal, você assina." },
    { pontos: (r.madrugada?.vezes ?? 0) / 8, titulo: "Coruja das finanças", frase: "O seu dinheiro também não dorme." },
    { pontos: parte("restaurante") / 0.15, titulo: "Alma do rolê", frase: "Bar, restaurante, cafezinho: presença confirmada." },
    { pontos: parte("mercado") / 0.25, titulo: "Mestre da despensa", frase: "Geladeira cheia é o seu esporte." },
    { pontos: pixPorDia / 0.8, titulo: "Lenda do Pix", frase: "Chave aleatória? Você sabe de cor." },
    { pontos: parte("compras") / 0.12, titulo: "Rastreador de encomendas", frase: "O entregador já sabe o seu nome." },
  ];
  const melhor = opcoes.sort((a, b) => b.pontos - a.pontos)[0];
  if (!melhor || melhor.pontos < 1) {
    return { titulo: "Equilíbrio raro", frase: "Nenhum exagero à vista. Quase suspeito." };
  }
  return { titulo: melhor.titulo, frase: melhor.frase };
}
