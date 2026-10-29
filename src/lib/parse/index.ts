import { ExtratoInvalido, type BancoId, type ExtratoLido, type Lancamento } from "../types";
import { lerCsvDeBanco } from "./csv-bancos";
import { ehOfx, lerOfx } from "./ofx";
import { decodificar, normalizar } from "./texto";

export { ExtratoInvalido };

/** Palpite de banco pelo nome do arquivo, para o CSV genérico. */
export function bancoPeloNome(nome: string): BancoId {
  const n = normalizar(nome);
  if (/^nu_|nubank/.test(n)) return "nubank";
  if (/inter/.test(n)) return "inter";
  if (/itau/.test(n)) return "itau";
  if (/\bc6\b|c6bank|c6_/.test(n)) return "c6";
  if (/bradesco/.test(n)) return "bradesco";
  if (/\bbb\b|banco ?do ?brasil/.test(n)) return "bb";
  if (/santander/.test(n)) return "santander";
  if (/mercado ?pago|account_statement/.test(n)) return "mercadopago";
  if (/picpay/.test(n)) return "picpay";
  if (/caixa/.test(n)) return "caixa";
  return "outro";
}

/** Lê um arquivo de extrato a partir do texto já decodificado. */
export function lerExtratoTexto(nomeArquivo: string, texto: string): ExtratoLido {
  if (!texto.trim()) throw new ExtratoInvalido("O arquivo está vazio.");
  if (ehOfx(texto)) return lerOfx(texto);
  if (/^%PDF/.test(texto)) {
    throw new ExtratoInvalido("PDF precisa ser lido pelo leitor de PDF.");
  }
  return lerCsvDeBanco(texto, bancoPeloNome(nomeArquivo));
}

/** Lê um arquivo de extrato a partir dos bytes (o que o navegador entrega). */
export function lerExtrato(nomeArquivo: string, bytes: ArrayBuffer | Uint8Array): ExtratoLido {
  return lerExtratoTexto(nomeArquivo, decodificar(bytes));
}

/**
 * Junta vários extratos (conta + cartão, ou bancos diferentes) e tira
 * duplicados de quem subiu o mesmo período duas vezes.
 */
export function juntar(extratos: ExtratoLido[]): Lancamento[] {
  const vistos = new Set<string>();
  const todos: Lancamento[] = [];
  for (const e of extratos) {
    const contagem = new Map<string, number>();
    for (const l of e.lancamentos) {
      // Dentro do mesmo arquivo, dois lançamentos iguais são reais (dois cafés).
      // Entre arquivos, o mesmo lançamento é duplicado.
      const base = l.id
        ? `${l.banco}|${l.id}`
        : `${l.banco}|${l.origem}|${l.data}|${l.valor}|${normalizar(l.descricao)}`;
      const n = (contagem.get(base) ?? 0) + 1;
      contagem.set(base, n);
      const chave = `${base}#${n}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      todos.push(l);
    }
  }
  return todos.sort((a, b) => (a.data + (a.hora ?? "")).localeCompare(b.data + (b.hora ?? "")));
}
