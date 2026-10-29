/**
 * Transforma os bytes do arquivo em texto. Os bancos misturam UTF-8 e
 * Windows-1252 (o OFX do Inter, por exemplo, declara CHARSET:1252), então
 * tentamos UTF-8 estrito primeiro e caímos para 1252 se não for válido.
 */
export function decodificar(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(u8.subarray(3));
  }
  if (u8[0] === 0xff && u8[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(u8.subarray(2));
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(u8);
  } catch {
    return new TextDecoder("windows-1252").decode(u8);
  }
}

/** Minúsculas, sem acentos e com espaços simples: base para comparar textos. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "JOAO DA SILVA" → "Joao da Silva", mantendo siglas curtas como estão. */
export function nomeProprio(texto: string): string {
  const minusculas = new Set(["da", "de", "do", "das", "dos", "e"]);
  return texto
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) =>
      i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1),
    )
    .join(" ");
}

/** "Mariana Souza Lima" → "M. S. L." para esconder nomes ao compartilhar. */
export function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-Z]/.test(p))
    .filter((p) => !["da", "de", "do", "das", "dos"].includes(p.toLowerCase()))
    .map((p) => p.charAt(0).toUpperCase() + ".")
    .join(" ");
}
