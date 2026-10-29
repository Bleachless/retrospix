"use client";

import { domToBlob } from "modern-screenshot";

export const LARGURA = 1080;
export const ALTURA = 1920;

/**
 * Tira a "foto" de um card já montado em 1080×1920 (fora da tela) e
 * devolve um PNG. Tudo acontece no navegador: a imagem nunca sai daqui a
 * não ser que a pessoa compartilhe.
 */
export async function cardParaPng(no: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  const blob = await domToBlob(no, {
    width: LARGURA,
    height: ALTURA,
    scale: 1,
    type: "image/png",
    // Sem worker: tudo na própria página, e nada de buscar fora dela.
    workerNumber: 0,
  });
  if (!blob) throw new Error("Não foi possível gerar a imagem.");
  return blob;
}

export function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Compartilha pela Web Share API quando o aparelho aceita arquivo
 * (celulares, em geral). Se não aceitar, baixa o PNG.
 */
export async function compartilhar(blob: Blob, nome: string): Promise<"compartilhado" | "baixado" | "cancelado"> {
  const arquivo = new File([blob], nome, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({
        files: [arquivo],
        title: "Meu Retrospix",
        text: "Meu ano em Pix. Faça o seu em retrospix.joaovaz.dev (o extrato não sai do celular).",
      });
      return "compartilhado";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelado";
    }
  }
  baixar(blob, nome);
  return "baixado";
}
