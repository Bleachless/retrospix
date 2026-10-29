import { describe, expect, it } from "vitest";
import type { Lancamento } from "../types";
import { classificar, extrairContraparte } from "./categorias";

const l = (descricao: string, valor = -10, extra: Partial<Lancamento> = {}): Lancamento => ({
  data: "2026-01-10",
  hora: null,
  valor,
  descricao,
  origem: "conta",
  banco: "nubank",
  ...extra,
});

describe("contraparte do Pix", () => {
  it.each([
    ["Transferência enviada pelo Pix - FULANA DE TESTE - •••.111.222-•• - BANCO FICTICIO (0999) Agência: 1 Conta: 1-1", "Fulana de Teste", "pessoa"],
    ["Transferência enviada pelo Pix - LOJA EXEMPLO - 12.345.678/0001-90 - BCO FICTICIO", "Loja Exemplo", "empresa"],
    ["Pix - Enviado - 07/04 02:13 Beltrano Teste", "Beltrano Teste", "pessoa"],
    ["PIX ENVIADO - Padaria Pão Quente", "Padaria Pão Quente", "pessoa"],
    ["PIX TRANSF CICLANO12/03", "Ciclano", "pessoa"],
    ["PIX RECEBIDO - Cp :12345678-FULANO DE TAL", "Fulano de Tal", "pessoa"],
    ["Transferência Pix enviada Fulano Teste", "Fulano Teste", "pessoa"],
    ["PIX ENVIADO EMPRESA INVENTADA LTDA", "Empresa Inventada Ltda", "empresa"],
  ])("%s", (descricao, nome, tipo) => {
    expect(extrairContraparte(descricao)).toEqual({ nome, tipo });
  });
});

describe("classificar", () => {
  it.each([
    ["Compra no débito - IFOOD *PIZZARIA FICTICIA", "delivery", "iFood"],
    ["IFD*RESTAURANTE TESTE", "delivery", "iFood"],
    ["UBER *EATS PENDING", "delivery", "Uber Eats"],
    ["Compra no débito - UBER *TRIP", "transporte", "Uber"],
    ["99APP *99POP", "transporte", "99"],
    ["Compra no débito - NETFLIX.COM", "assinatura", "Netflix"],
    ["AMAZON PRIME CANAIS", "assinatura", "Amazon Prime"],
    ["AMAZON MARKETPLACE", "compras", "Amazon"],
    ["MERCADOLIVRE*LOJA", "compras", "Mercado Livre"],
    ["Compra no débito - SUPERMERCADO SAVEGNAGO", "mercado", "Savegnago"],
    ["Compra no débito - DROGARIA INVENTADA", "farmacia", "Drogaria Inventada"],
    ["Compra no débito - AUTO POSTO EXEMPLO", "combustivel", "Auto Posto Exemplo"],
    ["Compra no débito - BAR DO TESTE", "restaurante", "Bar do Teste"],
    ["Transferência enviada pelo Pix - CLARO - 40.000.000/0001-00 - BCO", "contas", "Claro"],
    ["Pagamento de fatura", "fatura", "Fatura do cartão"],
    ["Aplicação RDB", "investimento", "Aplicação Rdb"],
  ])("%s → %s", (descricao, categoria, nome) => {
    const c = classificar(l(descricao));
    expect(c.categoria).toBe(categoria);
    expect(c.nome).toBe(nome);
  });

  it("Pix para pessoa é transferência, mesmo com nome de lugar", () => {
    const c = classificar(l("Transferência enviada pelo Pix - BAR TOLOMEU SANTOS - •••.111.222-•• - BCO"));
    expect(c).toMatchObject({ pix: true, categoria: "transferencia", contraparteTipo: "pessoa", chave: "@bar tolomeu santos" });
  });

  it("salário só quando entra dinheiro", () => {
    expect(classificar(l("Transferência recebida - EMPRESA X LTDA - Salário", 5000)).categoria).toBe("salario");
  });

  it("agrupa o mesmo lugar com códigos diferentes", () => {
    expect(classificar(l("Compra no débito - CAFE TESTE-LJ0021")).chave).toBe(classificar(l("Compra no débito - CAFE TESTE-LJ0042")).chave);
  });
});
