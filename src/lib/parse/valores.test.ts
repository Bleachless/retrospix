import { describe, expect, it } from "vitest";
import { lerData, lerValor } from "./valores";
import { decodificar, iniciais, nomeProprio, normalizar } from "./texto";
import { detectarSeparador, lerCsv } from "./csv";

describe("lerValor", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["-1.234,56", -1234.56],
    ["1234.56", 1234.56],
    ["-89.00", -89],
    ["R$ 12,90", 12.9],
    ["R$ -12,90", -12.9],
    ["(15,00)", -15],
    ["150,00 D", -150],
    ["150,00 C", 150],
    ["1,234.56", 1234.56],
    ["1.234", 1234],
    ["0.5", 0.5],
    ["+20", 20],
  ])("%s → %d", (bruto, esperado) => {
    expect(lerValor(bruto)).toBe(esperado);
  });

  it("devolve null para texto", () => {
    expect(lerValor("")).toBeNull();
    expect(lerValor("abc")).toBeNull();
    expect(lerValor("12/10")).toBeNull();
  });
});

describe("lerData", () => {
  it("lê os formatos brasileiros, ISO e OFX", () => {
    expect(lerData("31/12/2026")).toEqual({ data: "2026-12-31", hora: null });
    expect(lerData("05/03/26")).toEqual({ data: "2026-03-05", hora: null });
    expect(lerData("05-03-2026")).toEqual({ data: "2026-03-05", hora: null });
    expect(lerData("2026-03-05")).toEqual({ data: "2026-03-05", hora: null });
    expect(lerData("2026-03-05T23:41:10.000-03:00")).toEqual({ data: "2026-03-05", hora: "23:41" });
    expect(lerData("05/03/2026 01:15")).toEqual({ data: "2026-03-05", hora: "01:15" });
    expect(lerData("20261001")).toEqual({ data: "2026-10-01", hora: null });
    expect(lerData("20261001143000[-3:BRT]")).toEqual({ data: "2026-10-01", hora: "14:30" });
  });

  it("meia-noite cravada no OFX é falta de hora, não madrugada", () => {
    expect(lerData("20261001000000[-3:BRT]")).toEqual({ data: "2026-10-01", hora: null });
  });

  it("recusa datas impossíveis", () => {
    expect(lerData("32/13/2026")).toBeNull();
    expect(lerData("Saldo")).toBeNull();
  });
});

describe("texto", () => {
  it("decodifica UTF-8 e cai para Windows-1252", () => {
    expect(decodificar(new TextEncoder().encode("Agência"))).toBe("Agência");
    // "Agência" em 1252: ê = 0xEA
    expect(decodificar(new Uint8Array([0x41, 0x67, 0xea, 0x6e, 0x63, 0x69, 0x61]))).toBe("Agência");
    expect(decodificar(new Uint8Array([0xef, 0xbb, 0xbf, 0x4f, 0x69]))).toBe("Oi");
  });

  it("normaliza, arruma nomes e faz iniciais", () => {
    expect(normalizar("  Transferência  ENVIADA ")).toBe("transferencia enviada");
    expect(nomeProprio("MARINA DE SOUZA LIMA")).toBe("Marina de Souza Lima");
    expect(iniciais("Marina de Souza Lima")).toBe("M. S. L.");
  });
});

describe("csv", () => {
  it("detecta o separador e respeita aspas", () => {
    expect(detectarSeparador("a;b;c\n1;2;3")).toBe(";");
    expect(detectarSeparador("a,b,c\n1,2,3")).toBe(",");
    expect(lerCsv('"Data","Valor"\n"01/01/2026","1.234,56"\n"02/01/2026","Bar ""do Zé"", centro"')).toEqual([
      ["Data", "Valor"],
      ["01/01/2026", "1.234,56"],
      ["02/01/2026", 'Bar "do Zé", centro'],
    ]);
  });
});
