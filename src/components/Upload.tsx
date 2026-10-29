"use client";

import { useRef, useState } from "react";
import { FileUp, Sparkles } from "lucide-react";
import { gerarDemo } from "@/lib/demo";
import { lerExtrato } from "@/lib/parse";
import { useRetro, type Arquivo } from "@/lib/store";
import { ExtratoInvalido } from "@/lib/types";

/** Abre os arquivos aqui mesmo, no navegador. Nada é enviado. */
export async function lerArquivos(lista: FileList | File[]): Promise<{ lidos: Arquivo[]; erros: string[] }> {
  const lidos: Arquivo[] = [];
  const erros: string[] = [];
  for (const f of Array.from(lista)) {
    try {
      if (f.size > 25 * 1024 * 1024) throw new ExtratoInvalido("arquivo grande demais (mais de 25 MB).");
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        throw new ExtratoInvalido("PDF ainda não é lido aqui. Exporte o extrato em OFX ou CSV.");
      }
      const extrato = lerExtrato(f.name, bytes);
      if (extrato.lancamentos.length === 0) {
        throw new ExtratoInvalido("o arquivo não tem nenhum lançamento nesse período.");
      }
      lidos.push({ nome: f.name, extrato });
    } catch (e) {
      erros.push(`${f.name}: ${e instanceof ExtratoInvalido ? e.message : "não conseguimos ler este arquivo."}`);
    }
  }
  return { lidos, erros };
}

export function Upload() {
  const adicionar = useRetro((s) => s.adicionar);
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [erros, setErros] = useState<string[]>([]);

  async function receber(lista: FileList | File[]) {
    if (!lista.length) return;
    setLendo(true);
    const { lidos, erros } = await lerArquivos(lista);
    setErros(erros);
    setLendo(false);
    if (lidos.length) adicionar(lidos);
  }

  function demonstracao() {
    adicionar(
      [
        {
          nome: "extrato-de-mentira.ofx",
          extrato: { banco: "nubank", formato: "ofx", leitor: "Demonstração", lancamentos: gerarDemo(), avisos: [] },
        },
      ],
      true,
    );
  }

  return (
    <div className="w-full">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          receber(e.dataTransfer.files);
        }}
        className={`group relative flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-8 text-center transition ${
          arrastando ? "border-lima bg-lima/10" : "border-papel/25 bg-white/[0.04] hover:border-papel/50 hover:bg-white/[0.07]"
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lima text-tinta transition group-hover:scale-105">
          <FileUp className="h-7 w-7" />
        </span>
        <span className="text-xl font-extrabold tracking-tight">{lendo ? "Lendo o extrato…" : "Escolher extrato"}</span>
        <span className="text-sm text-papel/70">OFX ou CSV · pode juntar conta e cartão, ou mais de um banco</span>
        <input
          ref={entrada}
          type="file"
          accept=".ofx,.csv,.txt,.qfx,.pdf,text/csv,application/x-ofx"
          multiple
          className="sr-only"
          data-testid="arquivo"
          onChange={(e) => {
            if (e.target.files) receber(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {erros.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-2xl bg-tomate/15 px-4 py-3 text-sm text-[#ffb4ab]" role="alert">
          {erros.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <button
        onClick={demonstracao}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-papel/20 px-5 py-3.5 font-bold transition hover:bg-white/10"
      >
        <Sparkles className="h-5 w-5 text-amarelo" />
        Ver com um extrato de mentira
      </button>
      <p className="mt-3 text-center text-sm text-papel/60">
        Quer testar o upload?{" "}
        <a href="/extrato-de-exemplo.ofx" download className="font-semibold text-papel underline underline-offset-4">
          Baixe um extrato de exemplo
        </a>{" "}
        (fictício) e suba aqui.
      </p>
    </div>
  );
}
