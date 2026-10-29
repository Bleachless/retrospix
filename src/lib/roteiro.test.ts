import { describe, expect, it } from "vitest";
import { calcular } from "./analise/retrospectiva";
import { gerarDemo } from "./demo";
import { diaPorExtenso, nomeDoPeriodo, reais } from "./formatar";
import { roteiro } from "./roteiro";

describe("roteiro", () => {
  it("a demonstração mostra todos os cards, com madrugada", () => {
    expect(roteiro(calcular(gerarDemo()))).toEqual([
      "abertura",
      "pix",
      "pessoas",
      "calendario",
      "madrugada",
      "delivery",
      "transporte",
      "assinaturas",
      "comparacoes",
      "final",
    ]);
  });

  it("sem hora troca a madrugada pela semana e pula o que não tem", () => {
    const semHora = gerarDemo().map((l) => ({ ...l, hora: null }));
    const cards = roteiro(calcular(semHora));
    expect(cards).toContain("semana");
    expect(cards).not.toContain("madrugada");
    expect(roteiro(calcular([]))).toEqual(["abertura", "final"]);
  });
});

describe("formatar", () => {
  it("dinheiro, datas e períodos", () => {
    expect(reais(12.5).replace(/\s/g, " ")).toBe("R$ 12,50");
    expect(reais(12345.67).replace(/\s/g, " ")).toBe("R$ 12.346");
    expect(diaPorExtenso("2026-06-27")).toBe("27 de junho");
    expect(nomeDoPeriodo("2026-01-01", "2026-12-31")).toBe("2026");
    expect(nomeDoPeriodo("2026-10-01", "2026-10-27")).toBe("out/2026");
    expect(nomeDoPeriodo("2026-03-01", "2026-10-27")).toBe("mar a out de 2026");
    expect(nomeDoPeriodo("2025-10-29", "2026-10-27")).toBe("out/25 a out/26");
  });
});
