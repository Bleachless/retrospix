import { describe, expect, it } from "vitest";
import type { Lancamento } from "../types";
import { gerarDemo, paraOfx } from "../demo";
import { lerExtratoTexto } from "../parse";
import { classificar } from "./categorias";
import { comparar } from "./comparacoes";
import { acharRecorrentes } from "./recorrencia";
import { calcular, candidatosAEu } from "./retrospectiva";

const l = (data: string, valor: number, descricao: string, hora: string | null = null): Lancamento => ({
  data,
  hora,
  valor,
  descricao,
  origem: "conta",
  banco: "nubank",
});

const pixPara = (nome: string, doc = "•••.111.222-••") => `Transferência enviada pelo Pix - ${nome} - ${doc} - BCO FICTICIO`;
const pixDe = (nome: string, doc = "•••.111.222-••") => `Transferência recebida pelo Pix - ${nome} - ${doc} - BCO FICTICIO`;

describe("recorrência", () => {
  it("acha a cobrança mensal parecida e marca a pequena como esquecida", () => {
    const itens = ["2026-01-08", "2026-02-08", "2026-03-09", "2026-04-08"].flatMap((d) => [
      l(d, -9.9, "Compra no débito - APP INVENTADO PLUS"),
      l(d, -120, "Compra no débito - ACADEMIA TESTE"),
    ]);
    // e uma padaria, que se repete mas não é assinatura
    for (const d of ["2026-01-02", "2026-01-03", "2026-02-05", "2026-02-06", "2026-03-01", "2026-04-02"]) {
      itens.push(l(d, -7, "Compra no débito - PADARIA TESTE"));
    }
    const r = acharRecorrentes(itens.map(classificar));
    expect(r.map((x) => [x.nome, x.valor, x.meses, x.esquecida])).toEqual([
      ["Academia Teste", 120, 4, false],
      ["App Inventado Plus", 9.9, 4, true],
    ]);
    expect(r[0].anual).toBe(1440);
  });

  it("assinatura de marca conhecida entra mesmo num extrato de um mês", () => {
    const r = acharRecorrentes([l("2026-01-03", -44.9, "NETFLIX.COM"), l("2026-01-04", -30, "LOJA X")].map(classificar));
    expect(r.map((x) => x.nome)).toEqual(["Netflix"]);
  });

  it("valor que muda muito não é recorrência", () => {
    const r = acharRecorrentes(
      ["2026-01-08", "2026-02-08", "2026-03-08"].map((d, i) => l(d, -(20 + i * 80), "LOJA VARIAVEL")).map(classificar),
    );
    expect(r).toEqual([]);
  });
});

describe("comparações", () => {
  it("escolhe a primeira referência que dá pelo menos 1,5", () => {
    expect(comparar("Seu delivery", 5400, ["aluguel", "cesta"])).toMatchObject({ quantidade: 3, texto: "3 meses de aluguel" });
    expect(comparar("Seu delivery", 900, ["aluguel", "cesta", "rodizio"])).toMatchObject({ referencia: "rodizio", quantidade: 12 });
    expect(comparar("Nada", 0, ["aluguel"])).toBeNull();
  });
});

describe("calcular", () => {
  const base = [
    l("2026-01-05", 5000, "Transferência recebida - EMPRESA X LTDA - Salário", "08:00"),
    l("2026-01-06", -100, pixPara("FULANA DE TESTE"), "10:00"),
    l("2026-01-07", -50, pixPara("FULANA DE TESTE"), "11:00"),
    l("2026-01-08", -30, pixPara("BELTRANO TESTE"), "12:00"),
    l("2026-01-09", 40, pixDe("BELTRANO TESTE"), "13:00"),
    l("2026-01-10", -60, "Compra no débito - IFOOD *LANCHE", "02:30"),
    l("2026-01-10", -25, "Compra no débito - UBER *TRIP", "03:10"),
    l("2026-02-01", -1000, "Aplicação RDB", "09:00"),
    l("2026-02-02", 2000, pixDe("EU MESMO DA SILVA"), "09:00"),
    l("2026-02-03", -500, "Compra no débito - LOJA CARA", "15:00"),
  ];

  it("soma Pix, ranqueia pessoas e ignora investimento", () => {
    const r = calcular(base);
    expect(r.pix.enviado).toBe(180);
    expect(r.pix.enviados).toBe(3);
    expect(r.pix.recebido).toBe(2040);
    expect(r.pix.paraQuem.map((p) => [p.nome, p.total, p.vezes])).toEqual([
      ["Fulana de Teste", 150, 2],
      ["Beltrano Teste", 30, 1],
    ]);
    expect(r.gastos).toBe(765);
    expect(r.periodo).toMatchObject({ inicio: "2026-01-05", fim: "2026-02-03", meses: 2, ano: 2026 });
  });

  it("marca de 'sou eu' tira a transferência entre contas", () => {
    const eu = candidatosAEu(base).find((p) => p.nome === "Eu Mesmo da Silva")!;
    const r = calcular(base, { ignorar: [eu.chave] });
    expect(r.pix.recebido).toBe(40);
    expect(r.entradas).toBe(5040);
    expect(r.ignorados).toEqual(["@eu mesmo da silva"]);
  });

  it("mês e dia mais caros, madrugada, delivery e transporte", () => {
    const r = calcular(base);
    expect(r.mesMaisCaro).toEqual({ mes: "2026-02", gasto: 500 });
    expect(r.diaMaisCaro).toMatchObject({ data: "2026-02-03", gasto: 500, principal: { nome: "Loja Cara" } });
    expect(r.temHora).toBe(true);
    expect(r.madrugada).toMatchObject({ total: 85, vezes: 2, horaMaisTarde: "03:10" });
    expect(r.delivery).toMatchObject({ total: 60, vezes: 1, top: [{ nome: "iFood", total: 60, vezes: 1 }] });
    expect(r.transporte.total).toBe(25);
  });

  it("sem hora no extrato não inventa madrugada", () => {
    const r = calcular(base.map((x) => ({ ...x, hora: null })));
    expect(r.temHora).toBe(false);
    expect(r.madrugada).toBeNull();
    expect(r.semana.fimDeSemana + r.semana.diaUtil).toBe(r.gastos);
  });

  it("com a fatura no meio, não conta a compra duas vezes", () => {
    const r = calcular([
      l("2026-01-10", -300, "Pagamento de fatura"),
      { ...l("2026-01-03", -300, "LOJA NO CARTAO"), origem: "cartao" },
    ]);
    expect(r.gastos).toBe(300);
    // só a conta: a fatura é o gasto
    expect(calcular([l("2026-01-10", -300, "Pagamento de fatura")]).gastos).toBe(300);
  });

  it("extrato vazio não quebra", () => {
    const r = calcular([]);
    expect(r.gastos).toBe(0);
    expect(r.mesMaisCaro).toBeNull();
    expect(r.persona.titulo).toBe("Equilíbrio raro");
  });
});

describe("demonstração", () => {
  it("é determinística e passa pelo leitor de OFX sem perder nada", () => {
    const demo = gerarDemo();
    expect(gerarDemo()).toEqual(demo);
    const lido = lerExtratoTexto("NU_demo.ofx", paraOfx(demo));
    expect(lido.banco).toBe("nubank");
    expect(lido.lancamentos).toHaveLength(demo.length);
    expect(lido.lancamentos.map((x) => [x.data, x.hora, x.valor, x.descricao])).toEqual(
      demo.map((x) => [x.data, x.hora === "00:00" ? null : x.hora, x.valor, x.descricao]),
    );
  });

  it("rende todos os cards", () => {
    const r = calcular(gerarDemo());
    expect(r.periodo.dias).toBeGreaterThan(360);
    expect(r.pix.paraQuem).toHaveLength(5);
    expect(r.madrugada!.vezes).toBeGreaterThan(5);
    expect(r.delivery.vezes).toBeGreaterThan(50);
    expect(r.assinaturas.itens.map((a) => a.nome)).toEqual(
      expect.arrayContaining(["Netflix", "Spotify", "Smart Fit", "Apple", "Duolingo"]),
    );
    expect(r.assinaturas.esquecidas.length).toBeGreaterThan(0);
    expect(r.comparacoes.length).toBeGreaterThanOrEqual(3);
    expect(r.persona.titulo).not.toBe("");
  });
});
