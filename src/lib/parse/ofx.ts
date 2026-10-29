import { ExtratoInvalido, type BancoId, type ExtratoLido, type Lancamento } from "../types";
import { lerData } from "./valores";
import { normalizar } from "./texto";

/**
 * Leitor de OFX 1.x (SGML, sem tags de fechamento) e 2.x (XML).
 * É o formato que Nubank, Inter, Itaú, BB, Bradesco, Santander, C6 e Caixa
 * exportam, então um leitor só atende quase todo mundo.
 */
export function ehOfx(texto: string): boolean {
  return /OFXHEADER|<OFX>/i.test(texto.slice(0, 2000));
}

/** Valor de uma tag dentro de um bloco, com ou sem tag de fechamento. */
function tag(bloco: string, nome: string): string | null {
  const m = bloco.match(new RegExp(`<${nome}>([^<\\r\\n]*)`, "i"));
  if (!m) return null;
  return desescapar(m[1].trim());
}

function desescapar(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Códigos FEBRABAN de cada banco, como aparecem em BANKID e FID. */
const CODIGOS: Record<string, BancoId> = {
  "260": "nubank",
  "077": "inter",
  "341": "itau",
  "336": "c6",
  "237": "bradesco",
  "001": "bb",
  "033": "santander",
  "323": "mercadopago",
  "380": "picpay",
  "104": "caixa",
};

export function bancoDoOfx(texto: string): BancoId {
  const org = normalizar(tag(texto, "ORG") ?? "");
  const codigos = [tag(texto, "BANKID"), tag(texto, "FID")]
    .filter((c): c is string => Boolean(c))
    .map((c) => c.replace(/\D/g, "").padStart(3, "0").slice(-3));
  for (const c of codigos) if (CODIGOS[c]) return CODIGOS[c];
  const nomes: [RegExp, BancoId][] = [
    [/\bnu pagamentos|nubank/, "nubank"],
    [/intermedium|\binter\b/, "inter"],
    [/itau/, "itau"],
    [/\bc6\b|banco c6/, "c6"],
    [/bradesco/, "bradesco"],
    [/banco do brasil/, "bb"],
    [/santander/, "santander"],
    [/mercado ?pago/, "mercadopago"],
    [/picpay/, "picpay"],
    [/caixa/, "caixa"],
  ];
  for (const [re, id] of nomes) if (re.test(org)) return id;
  return "outro";
}

export function lerOfx(texto: string): ExtratoLido {
  if (!ehOfx(texto)) throw new ExtratoInvalido("Esse arquivo não parece um OFX.");
  const banco = bancoDoOfx(texto);
  const cartao = /<CREDITCARDMSGSRSV1>|<CCSTMTRS>/i.test(texto);
  const blocos = texto.split(/<STMTTRN>/i).slice(1);
  const avisos: string[] = [];
  const lancamentos: Lancamento[] = [];

  for (const bruto of blocos) {
    const bloco = bruto.split(/<\/STMTTRN>|<\/BANKTRANLIST>/i)[0];
    const data = lerData(tag(bloco, "DTPOSTED") ?? tag(bloco, "DTUSER") ?? "");
    const valor = Number((tag(bloco, "TRNAMT") ?? "").replace(",", "."));
    if (!data || !Number.isFinite(valor)) {
      avisos.push("Um lançamento sem data ou valor foi ignorado.");
      continue;
    }
    const memo = tag(bloco, "MEMO") ?? "";
    const nome = tag(bloco, "NAME") ?? "";
    // Alguns bancos põem o principal em NAME e o detalhe em MEMO, outros o contrário.
    const descricao = [nome, memo].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(" - ");
    const tipo = tag(bloco, "TRNTYPE") ?? undefined;
    let v = Math.round(valor * 100) / 100;
    // Alguns OFX mandam o valor sempre positivo e o sinal no TRNTYPE.
    if (v > 0 && tipo && /^(DEBIT|PAYMENT|FEE|SRVCHG|ATM|POS|CHECK)$/i.test(tipo) && !cartao) v = -v;
    lancamentos.push({
      data: data.data,
      hora: data.hora ?? horaNoTexto(descricao),
      valor: v,
      descricao: descricao || tipo || "Lançamento",
      tipo,
      id: tag(bloco, "FITID") ?? undefined,
      origem: cartao ? "cartao" : "conta",
      banco,
    });
  }

  // Na fatura em OFX, compra costuma vir negativa e pagamento positivo,
  // que já é o sentido que usamos. Se vier tudo positivo, invertemos.
  if (cartao && lancamentos.length > 0 && lancamentos.every((l) => l.valor >= 0)) {
    for (const l of lancamentos) l.valor = -l.valor;
  }

  return { banco, formato: "ofx", leitor: cartao ? "OFX de cartão" : "OFX de conta", lancamentos, avisos };
}

/** O Banco do Brasil escreve "28/10 14:32" dentro do histórico. */
function horaNoTexto(texto: string): string | null {
  const m = texto.match(/\b\d{2}\/\d{2}\s+(\d{2}):(\d{2})\b/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? `${m[1]}:${m[2]}` : null;
}
