import { ExtratoInvalido, type BancoId, type ExtratoLido, type Lancamento } from "../types";
import { lerCsv } from "./csv";
import { normalizar } from "./texto";
import { lerData, lerValor } from "./valores";

/**
 * Um perfil descreve o CSV de um banco: como reconhecer a linha de cabeçalho
 * e de quais colunas sai cada informação. Os nomes das colunas são comparados
 * já normalizados (minúsculas, sem acento).
 */
type Perfil = {
  leitor: string;
  banco: BancoId;
  origem: "conta" | "cartao";
  /** Todas estas colunas precisam estar no cabeçalho. */
  exige: string[];
  data: string[];
  descricao: string[];
  /** Uma coluna com valor e sinal... */
  valor?: string[];
  /** ...ou colunas separadas de entrada e saída. */
  entrada?: string[];
  saida?: string[];
  /** Coluna que diz se é entrada ou saída, quando o valor vem sem sinal. */
  tipo?: { coluna: string[]; saida: RegExp };
  /** Fatura: compra vem positiva, então invertemos para virar saída. */
  inverter?: boolean;
  /** Linhas de saldo e totais que não são lançamentos. */
  ignorar?: RegExp;
};

const PERFIS: Perfil[] = [
  {
    leitor: "Nubank conta (CSV)",
    banco: "nubank",
    origem: "conta",
    exige: ["data", "valor", "identificador", "descricao"],
    data: ["data"],
    descricao: ["descricao"],
    valor: ["valor"],
  },
  {
    leitor: "Nubank cartão (CSV)",
    banco: "nubank",
    origem: "cartao",
    exige: ["date", "title", "amount"],
    data: ["date"],
    descricao: ["title"],
    valor: ["amount"],
    inverter: true,
  },
  {
    leitor: "Inter conta (CSV)",
    banco: "inter",
    origem: "conta",
    exige: ["data lancamento", "historico", "descricao", "valor"],
    data: ["data lancamento"],
    descricao: ["historico", "descricao"],
    valor: ["valor"],
  },
  {
    leitor: "Inter cartão (CSV)",
    banco: "inter",
    origem: "cartao",
    exige: ["data", "lancamento", "categoria", "tipo", "valor"],
    data: ["data"],
    descricao: ["lancamento"],
    valor: ["valor"],
    inverter: true,
  },
  {
    leitor: "Mercado Pago (CSV)",
    banco: "mercadopago",
    origem: "conta",
    exige: ["release_date", "transaction_type", "transaction_net_amount"],
    data: ["release_date"],
    descricao: ["transaction_type"],
    valor: ["transaction_net_amount"],
  },
  {
    leitor: "C6 cartão (CSV)",
    banco: "c6",
    origem: "cartao",
    exige: ["data de compra", "descricao", "valor (em r$)"],
    data: ["data de compra"],
    descricao: ["descricao", "parcela"],
    valor: ["valor (em r$)"],
    inverter: true,
  },
  {
    leitor: "C6 conta (CSV)",
    banco: "c6",
    origem: "conta",
    exige: ["data lancamento", "titulo", "descricao", "entrada(r$)", "saida(r$)"],
    data: ["data lancamento"],
    descricao: ["titulo", "descricao"],
    entrada: ["entrada(r$)"],
    saida: ["saida(r$)"],
  },
  {
    leitor: "Banco do Brasil (CSV)",
    banco: "bb",
    origem: "conta",
    exige: ["data", "lancamento", "valor", "tipo lancamento"],
    data: ["data"],
    descricao: ["lancamento", "detalhes"],
    valor: ["valor"],
    tipo: { coluna: ["tipo lancamento"], saida: /saida|debito/ },
    ignorar: /^(saldo|s a l d o)/,
  },
  {
    leitor: "Bradesco (CSV)",
    banco: "bradesco",
    origem: "conta",
    exige: ["data", "historico", "credito (r$)", "debito (r$)"],
    data: ["data"],
    descricao: ["historico"],
    entrada: ["credito (r$)"],
    saida: ["debito (r$)"],
    ignorar: /^(saldo anterior|total|saldo)/,
  },
];

/** Colunas que o leitor genérico aceita para cada informação. */
const GENERICO = {
  data: [/^data$/, /^date$/, /^data (do )?lancamento$/, /^data da transacao$/, /^dt/, /data/],
  descricao: [/descri/, /historico/, /^lancamento$/, /^title$/, /estabelecimento/, /detalhe/, /^memo$/, /nome/],
  valor: [/^valor( \(r\$\))?$/, /^amount$/, /^value$/, /valor/, /montante/],
  entrada: [/^credito/, /^entrada/, /^entradas/],
  saida: [/^debito/, /^saida/, /^saidas/],
};

function achar(cabecalho: string[], nomes: string[]): number[] {
  return nomes.map((n) => cabecalho.indexOf(n)).filter((i) => i >= 0);
}

function acharPadrao(cabecalho: string[], padroes: RegExp[], usadas: Set<number>): number {
  for (const p of padroes) {
    const i = cabecalho.findIndex((c, idx) => !usadas.has(idx) && p.test(c));
    if (i >= 0) return i;
  }
  return -1;
}

type Mapa = {
  data: number;
  descricao: number[];
  valor: number;
  entrada: number;
  saida: number;
  tipo: number;
  tipoSaida?: RegExp;
  inverter: boolean;
  ignorar?: RegExp;
};

function converter(
  linhas: string[][],
  inicio: number,
  mapa: Mapa,
  banco: BancoId,
  origem: "conta" | "cartao",
): { lancamentos: Lancamento[]; ignoradas: number } {
  const lancamentos: Lancamento[] = [];
  let ignoradas = 0;
  for (const linha of linhas.slice(inicio)) {
    const data = lerData(linha[mapa.data] ?? "");
    const descricao = mapa.descricao
      .map((i) => linha[i] ?? "")
      .filter(Boolean)
      .join(" - ")
      .trim();
    if (mapa.ignorar && mapa.ignorar.test(normalizar(descricao))) continue;
    let valor: number | null = null;
    if (mapa.valor >= 0) {
      valor = lerValor(linha[mapa.valor] ?? "");
      if (valor !== null && mapa.tipo >= 0 && mapa.tipoSaida) {
        const ehSaida = mapa.tipoSaida.test(normalizar(linha[mapa.tipo] ?? ""));
        valor = ehSaida ? -Math.abs(valor) : Math.abs(valor);
      }
    } else {
      const e = lerValor(linha[mapa.entrada] ?? "") ?? 0;
      const s = lerValor(linha[mapa.saida] ?? "") ?? 0;
      valor = e || s ? Math.abs(e) - Math.abs(s) : null;
    }
    if (!data || valor === null || valor === 0) {
      // linhas de rodapé, saldos e lançamentos zerados não contam
      if (linha.some((c) => c.trim())) ignoradas++;
      continue;
    }
    lancamentos.push({
      data: data.data,
      hora: data.hora,
      valor: mapa.inverter ? -valor : valor,
      descricao: descricao || "Lançamento",
      origem,
      banco,
    });
  }
  return { lancamentos, ignoradas };
}

export function lerCsvDeBanco(texto: string, bancoPorNome: BancoId = "outro"): ExtratoLido {
  const linhas = lerCsv(texto);
  if (linhas.length === 0) throw new ExtratoInvalido("O arquivo está vazio.");

  // 1) um perfil conhecido: procura o cabeçalho nas primeiras linhas,
  //    porque Inter, Mercado Pago e C6 põem um resumo antes da tabela.
  for (let i = 0; i < Math.min(linhas.length, 25); i++) {
    const cab = linhas[i].map(normalizar);
    const perfil = PERFIS.find((p) => p.exige.every((n) => cab.includes(n)));
    if (!perfil) continue;
    const mapa: Mapa = {
      data: achar(cab, perfil.data)[0],
      descricao: achar(cab, perfil.descricao),
      valor: perfil.valor ? achar(cab, perfil.valor)[0] ?? -1 : -1,
      entrada: perfil.entrada ? achar(cab, perfil.entrada)[0] ?? -1 : -1,
      saida: perfil.saida ? achar(cab, perfil.saida)[0] ?? -1 : -1,
      tipo: perfil.tipo ? achar(cab, perfil.tipo.coluna)[0] ?? -1 : -1,
      tipoSaida: perfil.tipo?.saida,
      inverter: Boolean(perfil.inverter),
      ignorar: perfil.ignorar,
    };
    const { lancamentos, ignoradas } = converter(linhas, i + 1, mapa, perfil.banco, perfil.origem);
    return {
      banco: perfil.banco,
      formato: "csv",
      leitor: perfil.leitor,
      lancamentos,
      avisos: ignoradas > 0 ? [`${ignoradas} linha(s) sem data ou valor foram puladas.`] : [],
    };
  }

  // 2) genérico: qualquer cabeçalho com data, descrição e valor.
  for (let i = 0; i < Math.min(linhas.length, 25); i++) {
    const cab = linhas[i].map(normalizar);
    const usadas = new Set<number>();
    const data = acharPadrao(cab, GENERICO.data, usadas);
    if (data < 0) continue;
    usadas.add(data);
    const entrada = acharPadrao(cab, GENERICO.entrada, usadas);
    const saida = acharPadrao(cab, GENERICO.saida, usadas);
    const valor = entrada >= 0 && saida >= 0 ? -1 : acharPadrao(cab, GENERICO.valor, usadas);
    if (valor < 0 && (entrada < 0 || saida < 0)) continue;
    [valor, entrada, saida].forEach((c) => c >= 0 && usadas.add(c));
    const descricao = acharPadrao(cab, GENERICO.descricao, usadas);
    if (descricao < 0) continue;
    const mapa: Mapa = { data, descricao: [descricao], valor, entrada, saida, tipo: -1, inverter: false };
    const { lancamentos, ignoradas } = converter(linhas, i + 1, mapa, bancoPorNome, "conta");
    if (lancamentos.length === 0) continue;
    return {
      banco: bancoPorNome,
      formato: "csv",
      leitor: "CSV genérico",
      lancamentos,
      avisos: [
        "Não reconhecemos o banco deste CSV, então lemos pelas colunas de data, descrição e valor.",
        ...(ignoradas > 0 ? [`${ignoradas} linha(s) sem data ou valor foram puladas.`] : []),
      ],
    };
  }

  // 3) sem cabeçalho: a primeira coluna com data, a última com número.
  const semCabecalho = linhas.filter((l) => lerData(l[0] ?? "") && l.length >= 3);
  if (semCabecalho.length >= Math.max(1, linhas.length * 0.6)) {
    const ultimaNumerica = (l: string[]) => {
      for (let j = l.length - 1; j > 0; j--) if (lerValor(l[j]) !== null) return j;
      return -1;
    };
    const lancamentos: Lancamento[] = [];
    for (const l of semCabecalho) {
      const j = ultimaNumerica(l);
      const d = lerData(l[0])!;
      const v = j > 0 ? lerValor(l[j]) : null;
      if (v === null || v === 0) continue;
      const desc = l.slice(1, j).filter((c) => c && lerValor(c) === null).join(" - ");
      lancamentos.push({ data: d.data, hora: d.hora, valor: v, descricao: desc || "Lançamento", origem: "conta", banco: bancoPorNome });
    }
    if (lancamentos.length > 0) {
      return {
        banco: bancoPorNome,
        formato: "csv",
        leitor: "CSV sem cabeçalho",
        lancamentos,
        avisos: ["O CSV não tem cabeçalho; usamos a primeira coluna como data e a última numérica como valor."],
      };
    }
  }

  throw new ExtratoInvalido(
    "Não achamos as colunas de data, descrição e valor neste CSV. Se puder, exporte em OFX.",
  );
}
