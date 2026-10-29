import type { Retrospectiva } from "./analise/retrospectiva";

export type CardId =
  | "abertura"
  | "pix"
  | "pessoas"
  | "calendario"
  | "madrugada"
  | "semana"
  | "delivery"
  | "transporte"
  | "assinaturas"
  | "comparacoes"
  | "final";

/**
 * A ordem dos stories. Card sem dado não entra: quem não pede delivery não
 * vê um card de R$ 0. A madrugada só aparece quando o extrato traz horário;
 * sem horário, entra a comparação entre fim de semana e dia útil.
 */
export function roteiro(r: Retrospectiva): CardId[] {
  const cards: CardId[] = ["abertura"];
  if (r.pix.enviados + r.pix.recebidos > 0) cards.push("pix");
  if (r.pix.paraQuem.length > 0) cards.push("pessoas");
  if (r.diaMaisCaro) cards.push("calendario");
  if (r.madrugada && r.madrugada.vezes >= 3) cards.push("madrugada");
  else if (r.gastos > 0 && r.periodo.dias >= 7) cards.push("semana");
  if (r.delivery.vezes > 0) cards.push("delivery");
  if (r.transporte.vezes > 0) cards.push("transporte");
  if (r.assinaturas.itens.length > 0) cards.push("assinaturas");
  if (r.comparacoes.length > 0) cards.push("comparacoes");
  cards.push("final");
  return cards;
}
