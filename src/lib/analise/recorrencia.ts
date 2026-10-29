import type { Classificado } from "./categorias";

export type Recorrente = {
  nome: string;
  chave: string;
  /** Valor típico de cada cobrança (mediana). */
  valor: number;
  /** Em quantos meses diferentes apareceu. */
  meses: number;
  total: number;
  /** Quanto custa em 12 meses no valor atual. */
  anual: number;
  ultima: string;
  /** Detectada pela repetição (e não só pelo nome da marca). */
  porRepeticao: boolean;
  /** Pequena e insistente: a que a pessoa esquece que paga. */
  esquecida: boolean;
};

function mediana(valores: number[]): number {
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

const VALOR_ESQUECIDA = 20;

/**
 * Acha cobranças que se repetem todo mês no mesmo lugar e com valor
 * parecido. Assinaturas de marcas conhecidas entram mesmo aparecendo uma
 * vez só, porque o extrato pode ser curto.
 */
export function acharRecorrentes(lancamentos: Classificado[]): Recorrente[] {
  const mesesNoExtrato = new Set(lancamentos.map((l) => l.data.slice(0, 7))).size;
  const minimoMeses = Math.max(2, Math.min(3, mesesNoExtrato));
  const grupos = new Map<string, Classificado[]>();
  for (const l of lancamentos) {
    if (l.valor >= 0) continue;
    if (["fatura", "investimento", "transferencia", "salario"].includes(l.categoria)) continue;
    if (l.contraparteTipo === "pessoa") continue;
    if (!l.chave) continue;
    const g = grupos.get(l.chave) ?? [];
    g.push(l);
    grupos.set(l.chave, g);
  }

  const resultado: Recorrente[] = [];
  for (const [chave, itens] of grupos) {
    itens.sort((a, b) => a.data.localeCompare(b.data));
    const ehAssinatura = itens.some((i) => i.categoria === "assinatura");
    const porMes = new Map<string, number[]>();
    for (const i of itens) {
      const m = i.data.slice(0, 7);
      porMes.set(m, [...(porMes.get(m) ?? []), Math.abs(i.valor)]);
    }
    const meses = porMes.size;
    // valor de cada mês: a cobrança mais parecida com a mediana geral
    const valores = itens.map((i) => Math.abs(i.valor));
    const tipico = mediana(valores);
    const estaveis = [...porMes.values()].filter((vs) =>
      vs.some((v) => Math.abs(v - tipico) <= Math.max(2, tipico * 0.2)),
    ).length;

    let porRepeticao = false;
    if (meses >= minimoMeses && estaveis >= minimoMeses && estaveis / meses >= 0.75) {
      // e o intervalo entre as cobranças precisa ser de mais ou menos um mês
      const datas = [...porMes.keys()].sort();
      const lacunas = datas.slice(1).map((m, idx) => diasEntre(`${datas[idx]}-01`, `${m}-01`));
      const mensal = lacunas.every((d) => d >= 27 && d <= 62);
      // e não pode ser algo que se compra toda hora (padaria, café)
      const porMesMedio = itens.length / meses;
      porRepeticao = mensal && porMesMedio <= 1.5 && itens.length / meses <= 2;
    }
    if (!porRepeticao && !ehAssinatura) continue;
    // contas da casa e mercado se repetem, mas não são assinatura
    if (!ehAssinatura && ["mercado", "contas", "combustivel", "restaurante", "farmacia"].includes(itens[0].categoria)) {
      continue;
    }
    const valor = Math.round(tipico * 100) / 100;
    resultado.push({
      nome: itens[itens.length - 1].nome,
      chave,
      valor,
      meses,
      total: Math.round(valores.reduce((s, v) => s + v, 0) * 100) / 100,
      anual: Math.round(valor * 12 * 100) / 100,
      ultima: itens[itens.length - 1].data,
      porRepeticao,
      esquecida: valor <= VALOR_ESQUECIDA && (porRepeticao || meses >= 2),
    });
  }
  return resultado.sort((a, b) => b.anual - a.anual);
}
