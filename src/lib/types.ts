/** Um lançamento já normalizado, venha de qual banco vier. */
export type Lancamento = {
  /** Data no formato AAAA-MM-DD. */
  data: string;
  /** Hora no formato HH:MM, quando o extrato traz. */
  hora: string | null;
  /** Valor com sinal: negativo é saída, positivo é entrada. */
  valor: number;
  /** Texto do lançamento como o banco escreveu. */
  descricao: string;
  /** Tipo informado pelo banco, quando existe (CREDIT, DEBIT, "Pix enviado"...). */
  tipo?: string;
  /** Identificador do banco, quando existe (FITID do OFX). */
  id?: string;
  /** Conta corrente ou fatura de cartão. */
  origem: "conta" | "cartao";
  /** Banco que gerou o arquivo. */
  banco: BancoId;
};

export type BancoId =
  | "nubank"
  | "inter"
  | "itau"
  | "c6"
  | "bradesco"
  | "bb"
  | "santander"
  | "mercadopago"
  | "picpay"
  | "caixa"
  | "outro";

export type Formato = "ofx" | "csv" | "pdf";

export type ExtratoLido = {
  banco: BancoId;
  formato: Formato;
  /** Nome do leitor que entendeu o arquivo, para mostrar e depurar. */
  leitor: string;
  lancamentos: Lancamento[];
  avisos: string[];
};

export class ExtratoInvalido extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtratoInvalido";
  }
}
