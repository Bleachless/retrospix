"use client";

import { create } from "zustand";
import type { ExtratoLido } from "./types";

export type Arquivo = { nome: string; extrato: ExtratoLido };

type Estado = {
  etapa: "inicio" | "revisar" | "stories";
  arquivos: Arquivo[];
  demo: boolean;
  /** Chaves das pessoas que a usuária marcou como ela mesma. */
  ignorar: string[];
  esconderNomes: boolean;
  adicionar: (arquivos: Arquivo[], demo?: boolean) => void;
  remover: (nome: string) => void;
  alternarIgnorar: (chave: string) => void;
  setEsconderNomes: (v: boolean) => void;
  irPara: (etapa: Estado["etapa"]) => void;
  recomecar: () => void;
};

/**
 * Tudo fica só na memória da aba. Não usamos localStorage de propósito:
 * fechou a aba, o extrato sumiu.
 */
export const useRetro = create<Estado>()((set) => ({
  etapa: "inicio",
  arquivos: [],
  demo: false,
  ignorar: [],
  esconderNomes: false,
  adicionar: (novos, demo = false) =>
    set((s) => {
      const base = s.demo !== demo ? [] : s.arquivos;
      const nomes = new Set(novos.map((a) => a.nome));
      return {
        arquivos: [...base.filter((a) => !nomes.has(a.nome)), ...novos],
        demo,
        etapa: "revisar",
        ignorar: s.demo !== demo ? [] : s.ignorar,
      };
    }),
  remover: (nome) =>
    set((s) => {
      const arquivos = s.arquivos.filter((a) => a.nome !== nome);
      return { arquivos, etapa: arquivos.length ? s.etapa : "inicio" };
    }),
  alternarIgnorar: (chave) =>
    set((s) => ({
      ignorar: s.ignorar.includes(chave) ? s.ignorar.filter((c) => c !== chave) : [...s.ignorar, chave],
    })),
  setEsconderNomes: (esconderNomes) => set({ esconderNomes }),
  irPara: (etapa) => set({ etapa }),
  recomecar: () => set({ etapa: "inicio", arquivos: [], demo: false, ignorar: [], esconderNomes: false }),
}));
