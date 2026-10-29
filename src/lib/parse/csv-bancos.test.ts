import { describe, expect, it } from "vitest";
import { juntar, lerExtratoTexto } from ".";
import { ExtratoInvalido } from "../types";

// Todos os extratos daqui são inventados.

describe("CSV por banco", () => {
  it("Nubank conta", () => {
    const e = lerExtratoTexto(
      "NU_000000_01JAN2026_31JAN2026.csv",
      `Data,Valor,Identificador,Descrição
05/01/2026,350.00,id-1,Transferência recebida pelo Pix - FULANA DE TESTE - •••.111.222-•• - BANCO FICTICIO
06/01/2026,-42.90,id-2,"Compra no débito - IFOOD *LANCHE, CIA"`,
    );
    expect(e.leitor).toBe("Nubank conta (CSV)");
    expect(e.lancamentos.map((l) => [l.data, l.valor, l.origem])).toEqual([
      ["2026-01-05", 350, "conta"],
      ["2026-01-06", -42.9, "conta"],
    ]);
  });

  it("Nubank cartão: compra positiva vira saída", () => {
    const e = lerExtratoTexto(
      "Nubank_2026-02-10.csv",
      `date,title,amount
2026-01-12,Uber *Trip,23.45
2026-01-15,Pagamento recebido,-500.00
2026-01-20,Netflix.com,44.90`,
    );
    expect(e.leitor).toBe("Nubank cartão (CSV)");
    expect(e.lancamentos.map((l) => [l.valor, l.origem])).toEqual([
      [-23.45, "cartao"],
      [500, "cartao"],
      [-44.9, "cartao"],
    ]);
  });

  it("Inter conta, com o resumo antes da tabela", () => {
    const e = lerExtratoTexto(
      "Extrato-01-01-2026-a-31-01-2026.csv",
      `Extrato Conta Corrente
Conta ;000000
Período ;01/01/2026 a 31/01/2026
Saldo ;1.234,56

Data Lançamento;Histórico;Descrição;Valor;Saldo
10/01/2026;Pix enviado ;Padaria Fictícia;-19,90;1.214,66
12/01/2026;Pix recebido;Beltrano Teste;1.000,00;2.214,66`,
    );
    expect(e.banco).toBe("inter");
    expect(e.lancamentos.map((l) => [l.descricao, l.valor])).toEqual([
      ["Pix enviado - Padaria Fictícia", -19.9],
      ["Pix recebido - Beltrano Teste", 1000],
    ]);
  });

  it("Mercado Pago", () => {
    const e = lerExtratoTexto(
      "account_statement-0000.csv",
      `INITIAL_BALANCE;CREDITS;DEBITS;FINAL_BALANCE
100,00;200,00;-50,00;250,00

RELEASE_DATE;TRANSACTION_TYPE;REFERENCE_ID;TRANSACTION_NET_AMOUNT;PARTIAL_BALANCE
01-03-2026;Transferência Pix enviada Fulano Teste;111;-50,00;50,00
02-03-2026;Rendimentos;112;0,12;50,12`,
    );
    expect(e.banco).toBe("mercadopago");
    expect(e.lancamentos.map((l) => [l.data, l.valor])).toEqual([
      ["2026-03-01", -50],
      ["2026-03-02", 0.12],
    ]);
  });

  it("C6 fatura", () => {
    const e = lerExtratoTexto(
      "Fatura_2026-03.csv",
      `Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;Valor (em US$);Cotação (em R$);Valor (em R$)
05/02/2026;FULANO T;1234;Restaurante;RESTAURANTE FICTICIO;Única;0;0;87,50
06/02/2026;FULANO T;1234;Eletrônicos;LOJA INVENTADA;2/10;0;0;120,00`,
    );
    expect(e.leitor).toBe("C6 cartão (CSV)");
    expect(e.lancamentos.map((l) => [l.descricao, l.valor])).toEqual([
      ["RESTAURANTE FICTICIO - Única", -87.5],
      ["LOJA INVENTADA - 2/10", -120],
    ]);
  });

  it("Banco do Brasil: tipo diz se é saída e as linhas de saldo saem", () => {
    const e = lerExtratoTexto(
      "extrato.csv",
      `"Data","Lançamento","Detalhes","N° documento","Valor","Tipo Lançamento"
"01/04/2026","Saldo Anterior","","","1.000,00",""
"02/04/2026","Pix - Enviado","02/04 21:10 Fulano Teste","1","50,00","Saída"
"03/04/2026","Pix - Recebido","03/04 08:00 Beltrano Teste","2","20,00","Entrada"
"30/04/2026","S A L D O","","","970,00",""`,
    );
    expect(e.banco).toBe("bb");
    expect(e.lancamentos.map((l) => l.valor)).toEqual([-50, 20]);
  });

  it("Bradesco: crédito e débito em colunas separadas", () => {
    const e = lerExtratoTexto(
      "Bradesco_extrato.csv",
      `Extrato de: Agência: 0000 Conta: 00000-0
Data;Histórico;Docto.;Crédito (R$);Débito (R$);Saldo (R$)
01/05/2026;SALDO ANTERIOR;;;;100,00
02/05/2026;PIX ENVIADO FULANO;123;;30,00;70,00
03/05/2026;PIX RECEBIDO BELTRANO;124;15,00;;85,00`,
    );
    expect(e.banco).toBe("bradesco");
    expect(e.lancamentos.map((l) => l.valor)).toEqual([-30, 15]);
  });

  it("genérico: acha as colunas pelo nome e usa o nome do arquivo", () => {
    const e = lerExtratoTexto(
      "santander-maio.csv",
      `Data;Descrição;Documento;Valor (R$);Saldo (R$)
10/05/2026;PIX ENVIADO FULANO TESTE;000;-12,00;88,00`,
    );
    expect(e.leitor).toBe("CSV genérico");
    expect(e.banco).toBe("santander");
    expect(e.lancamentos[0]).toMatchObject({ data: "2026-05-10", valor: -12, descricao: "PIX ENVIADO FULANO TESTE" });
  });

  it("sem cabeçalho: data na primeira coluna e valor na última", () => {
    const e = lerExtratoTexto("itau.txt", `10/06/2026;PIX TRANSF FULANO;-15,00\n11/06/2026;RSHOP-MERCADO;-80,10`);
    expect(e.leitor).toBe("CSV sem cabeçalho");
    expect(e.lancamentos.map((l) => l.valor)).toEqual([-15, -80.1]);
  });

  it("explica quando não entende", () => {
    expect(() => lerExtratoTexto("x.csv", "nome;idade\nana;30")).toThrow(ExtratoInvalido);
    expect(() => lerExtratoTexto("x.csv", "   ")).toThrow(/vazio/);
  });
});

describe("juntar", () => {
  it("tira duplicados entre arquivos, mas mantém os repetidos de verdade", () => {
    const csv = `Data,Valor,Identificador,Descrição
01/01/2026,-5.00,,Compra no débito - CAFE
01/01/2026,-5.00,,Compra no débito - CAFE`;
    const a = lerExtratoTexto("NU_1.csv", csv);
    const b = lerExtratoTexto("NU_2.csv", csv);
    expect(juntar([a])).toHaveLength(2);
    expect(juntar([a, b])).toHaveLength(2);
  });
});
