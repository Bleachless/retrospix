const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const DIAS_DA_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** R$ 1.234,56 — ou R$ 1.235 sem centavos quando o número é grande. */
export function reais(valor: number, centavos = Math.abs(valor) < 1000): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: centavos ? 2 : 0,
    maximumFractionDigits: centavos ? 2 : 0,
  });
}

export function numero(n: number, casas = 0): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** "2026-06" → "junho" */
export function nomeDoMes(mes: string): string {
  return MESES[Number(mes.slice(5, 7)) - 1] ?? mes;
}

export function mesCurto(mes: string): string {
  return MESES_CURTOS[Number(mes.slice(5, 7)) - 1] ?? mes;
}

/** "2026-06-27" → "27 de junho" */
export function diaPorExtenso(data: string): string {
  return `${Number(data.slice(8, 10))} de ${MESES[Number(data.slice(5, 7)) - 1]}`;
}

/** "27/06/2026" */
export function dataCurta(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}

/** Como chamar o período: "2026", "out/2026" ou "nov/25 a out/26". */
export function nomeDoPeriodo(inicio: string, fim: string): string {
  if (!inicio) return "";
  const ai = inicio.slice(0, 4);
  const af = fim.slice(0, 4);
  const mi = inicio.slice(0, 7);
  const mf = fim.slice(0, 7);
  if (mi === mf) return `${MESES_CURTOS[Number(mi.slice(5)) - 1]}/${ai}`;
  if (ai === af && inicio.slice(5) <= "01-07" && fim.slice(5) >= "12-24") return ai;
  if (ai === af) return `${MESES_CURTOS[Number(mi.slice(5)) - 1]} a ${MESES_CURTOS[Number(mf.slice(5)) - 1]} de ${ai}`;
  return `${MESES_CURTOS[Number(mi.slice(5)) - 1]}/${ai.slice(2)} a ${MESES_CURTOS[Number(mf.slice(5)) - 1]}/${af.slice(2)}`;
}

export function plural(n: number, um: string, varios: string): string {
  return `${numero(n)} ${n === 1 ? um : varios}`;
}
