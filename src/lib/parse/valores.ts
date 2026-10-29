/**
 * Lê valores em qualquer um dos jeitos que os bancos escrevem:
 * "1.234,56", "-1.234,56", "1234.56", "R$ 1.234,56", "(12,00)", "12,00 D".
 * Devolve null quando não é um número.
 */
export function lerValor(bruto: string): number | null {
  let s = bruto.trim();
  if (!s) return null;
  let negativo = false;
  if (/^\(.*\)$/.test(s)) {
    negativo = true;
    s = s.slice(1, -1);
  }
  if (/\s?[dD]$/.test(s)) {
    negativo = true;
    s = s.replace(/\s?[dD]$/, "");
  } else if (/\s?[cC]$/.test(s)) {
    s = s.replace(/\s?[cC]$/, "");
  }
  s = s.replace(/R\$/gi, "").replace(/\s/g, "");
  if (s.startsWith("-")) {
    negativo = !negativo;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  if (!/^[\d.,]+$/.test(s)) return null;

  const ultimaVirgula = s.lastIndexOf(",");
  const ultimoPonto = s.lastIndexOf(".");
  let normal: string;
  if (ultimaVirgula > ultimoPonto) {
    // vírgula decimal: 1.234,56
    normal = s.replace(/\./g, "").replace(",", ".");
  } else if (ultimoPonto > ultimaVirgula) {
    // ponto decimal: 1,234.56 ou 1234.56; "1.234" sozinho é milhar
    const decimais = s.length - ultimoPonto - 1;
    const pontos = (s.match(/\./g) ?? []).length;
    if (ultimaVirgula === -1 && decimais === 3 && pontos >= 1 && !/^0\./.test(s)) {
      normal = s.replace(/\./g, "");
    } else {
      normal = s.replace(/,/g, "");
    }
  } else {
    normal = s;
  }
  const n = Number(normal);
  if (!Number.isFinite(n)) return null;
  return Math.round((negativo ? -n : n) * 100) / 100;
}

/**
 * Datas: "31/12/2026", "31/12/26", "2026-12-31", "20261231" e o OFX
 * "20261231143000[-3:BRT]". Devolve data AAAA-MM-DD e hora HH:MM (ou null).
 */
export function lerData(bruto: string): { data: string; hora: string | null } | null {
  const s = bruto.trim();
  let m = s.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4}|\d{2})(?:,?[ T](\d{2}):(\d{2}))?/);
  if (m) {
    const ano = m[3].length === 2 ? `20${m[3]}` : m[3];
    return montar(ano, m[2], m[1], m[4], m[5]);
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (m) return montar(m[1], m[2], m[3], m[4], m[5]);
  m = s.match(/^(\d{4})(\d{2})(\d{2})(?:(\d{2})(\d{2})(\d{2})?)?/);
  if (m) {
    const temHora = m[4] !== undefined && !(m[4] === "00" && m[5] === "00" && (m[6] ?? "00") === "00");
    return montar(m[1], m[2], m[3], temHora ? m[4] : undefined, temHora ? m[5] : undefined);
  }
  return null;
}

function montar(
  ano: string,
  mes: string,
  dia: string,
  h?: string,
  min?: string,
): { data: string; hora: string | null } | null {
  const a = Number(ano);
  const me = Number(mes);
  const d = Number(dia);
  if (me < 1 || me > 12 || d < 1 || d > 31 || a < 1990 || a > 2100) return null;
  const hora = h !== undefined && min !== undefined ? `${h}:${min}` : null;
  return { data: `${ano}-${mes}-${dia}`, hora };
}
