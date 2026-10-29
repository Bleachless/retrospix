/**
 * Preços de referência para as comparações. São aproximados, de 2026, e
 * servem para dar escala ao número, não para fazer conta de verdade.
 */
export const REFERENCIAS = {
  aluguel: { preco: 1800, singular: "mês de aluguel", plural: "meses de aluguel" },
  cesta: { preco: 850, singular: "cesta básica", plural: "cestas básicas" },
  rodizio: { preco: 75, singular: "rodízio de pizza", plural: "rodízios de pizza" },
  botijao: { preco: 115, singular: "botijão de gás", plural: "botijões de gás" },
  gasolina: { preco: 6.4, singular: "litro de gasolina", plural: "litros de gasolina" },
  coxinha: { preco: 8, singular: "coxinha", plural: "coxinhas" },
  cafezinho: { preco: 6, singular: "cafezinho", plural: "cafezinhos" },
  onibus: { preco: 5, singular: "passagem de ônibus", plural: "passagens de ônibus" },
  pao: { preco: 1, singular: "pãozinho", plural: "pãezinhos" },
} as const;

export type Referencia = keyof typeof REFERENCIAS;

export type Comparacao = {
  /** "Seu delivery", "Suas assinaturas"... */
  sujeito: string;
  valor: number;
  quantidade: number;
  referencia: Referencia;
  texto: string;
};

function formatarQuantidade(q: number): string {
  if (q >= 10) return Math.round(q).toLocaleString("pt-BR");
  return q.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

/**
 * Escolhe, na ordem de preferência, a primeira referência que dá pelo menos
 * 1,5 unidade. Assim o iFood vira meses de aluguel quando é muito e
 * rodízios quando é pouco.
 */
export function comparar(
  sujeito: string,
  valor: number,
  preferencia: Referencia[],
): Comparacao | null {
  if (valor <= 0) return null;
  for (const ref of preferencia) {
    const r = REFERENCIAS[ref];
    const quantidade = valor / r.preco;
    if (quantidade >= 1.5) {
      const q = quantidade >= 10 ? Math.round(quantidade) : Math.round(quantidade * 10) / 10;
      return {
        sujeito,
        valor,
        quantidade: q,
        referencia: ref,
        texto: `${formatarQuantidade(q)} ${q === 1 ? r.singular : r.plural}`,
      };
    }
  }
  return null;
}
