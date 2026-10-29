/** Escolhe o separador pela linha com mais campos entre `;`, `,` e tab. */
export function detectarSeparador(texto: string): string {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim()).slice(0, 30);
  let melhor = ",";
  let melhorPontos = -1;
  for (const sep of [";", ",", "\t"]) {
    const contagens = linhas.map((l) => dividirLinha(l, sep).length);
    const maior = Math.max(0, ...contagens);
    // conta quantas linhas têm o mesmo número de campos que a maior
    const pontos = maior > 1 ? contagens.filter((c) => c === maior).length * maior : 0;
    if (pontos > melhorPontos) {
      melhor = sep;
      melhorPontos = pontos;
    }
  }
  return melhor;
}

function dividirLinha(linha: string, sep: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (c === '"') {
        aspas = false;
      } else {
        atual += c;
      }
    } else if (c === '"') {
      aspas = true;
    } else if (c === sep) {
      campos.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

/** Lê o CSV inteiro em linhas de campos, respeitando aspas. Linhas vazias saem. */
export function lerCsv(texto: string, sep = detectarSeparador(texto)): string[][] {
  const linhas: string[] = [];
  let atual = "";
  let aspas = false;
  for (const c of texto.replace(/^﻿/, "")) {
    if (c === '"') aspas = !aspas;
    if ((c === "\n" || c === "\r") && !aspas) {
      if (atual.trim()) linhas.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }
  if (atual.trim()) linhas.push(atual);
  return linhas.map((l) => dividirLinha(l, sep));
}
