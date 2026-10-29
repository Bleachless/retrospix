"use client";

import { useRef, useState } from "react";
import { Check, EyeOff, Play, Plus, Trash2, UserRound } from "lucide-react";
import { candidatosAEu } from "@/lib/analise/retrospectiva";
import { NOME_BANCO } from "@/lib/bancos";
import { dataCurta, plural, reais } from "@/lib/formatar";
import { juntar } from "@/lib/parse";
import { useRetro } from "@/lib/store";
import { lerArquivos } from "./Upload";

export function Revisar() {
  const { arquivos, demo, ignorar, esconderNomes, adicionar, remover, alternarIgnorar, setEsconderNomes, irPara, recomecar } = useRetro();
  const mais = useRef<HTMLInputElement>(null);
  const [erros, setErros] = useState<string[]>([]);
  const todos = juntar(arquivos.map((a) => a.extrato));
  const pessoas = candidatosAEu(todos, 6);

  return (
    <div className="w-full space-y-4">
      <section className="rounded-3xl bg-white/[0.05] p-5 ring-1 ring-white/10">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-papel/60">
          <Check className="h-4 w-4 text-lima" /> Lido no seu aparelho
        </h2>
        <ul className="mt-3 space-y-3">
          {arquivos.map(({ nome, extrato }) => {
            const datas = extrato.lancamentos.map((l) => l.data).sort();
            return (
              <li key={nome} className="flex items-start gap-3" data-testid="arquivo-lido">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{demo ? "Extrato de mentira (demonstração)" : nome}</p>
                  <p className="text-sm text-papel/70">
                    {NOME_BANCO[extrato.banco]} · {extrato.leitor} · {plural(extrato.lancamentos.length, "lançamento", "lançamentos")}
                    {datas.length > 0 && ` · ${dataCurta(datas[0])} a ${dataCurta(datas[datas.length - 1])}`}
                  </p>
                  {extrato.avisos.map((a) => (
                    <p key={a} className="text-xs text-amarelo/90">
                      {a}
                    </p>
                  ))}
                </div>
                <button onClick={() => remover(nome)} className="rounded-full p-2 text-papel/50 transition hover:bg-white/10 hover:text-papel" aria-label={`Tirar ${nome}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
        {!demo && (
          <>
            <button
              onClick={() => mais.current?.click()}
              className="mt-4 flex items-center gap-2 text-sm font-bold text-lima transition hover:text-papel"
            >
              <Plus className="h-4 w-4" /> Juntar outro extrato (cartão, outro banco)
            </button>
            <input
              ref={mais}
              type="file"
              multiple
              accept=".ofx,.csv,.txt,.qfx,.pdf"
              className="sr-only"
              onChange={async (e) => {
                if (!e.target.files) return;
                const { lidos, erros } = await lerArquivos(e.target.files);
                setErros(erros);
                if (lidos.length) adicionar(lidos);
                e.target.value = "";
              }}
            />
          </>
        )}
        {erros.map((e) => (
          <p key={e} className="mt-2 text-sm text-[#ffb4ab]" role="alert">
            {e}
          </p>
        ))}
      </section>

      {pessoas.length > 0 && (
        <section className="rounded-3xl bg-white/[0.05] p-5 ring-1 ring-white/10">
          <h2 className="flex items-center gap-2 font-bold">
            <UserRound className="h-5 w-5 text-pix" /> Alguma dessas pessoas é você?
          </h2>
          <p className="mt-1 text-sm text-papel/70">
            Pix para a sua própria conta em outro banco não é gasto. Toque para tirar das contas.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pessoas.map((p) => {
              const marcado = ignorar.includes(p.chave);
              return (
                <button
                  key={p.chave}
                  onClick={() => alternarIgnorar(p.chave)}
                  aria-pressed={marcado}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    marcado ? "bg-pix text-tinta" : "bg-white/10 text-papel hover:bg-white/15"
                  }`}
                >
                  {marcado && <Check className="-ml-1 mr-1 inline h-4 w-4" />}
                  {p.nome} <span className="opacity-60">· {reais(p.total, false)}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <label className="flex cursor-pointer items-center gap-3 rounded-3xl bg-white/[0.05] p-5 ring-1 ring-white/10">
        <EyeOff className="h-5 w-5 shrink-0 text-rosa" />
        <span className="flex-1">
          <span className="block font-bold">Esconder nomes nos cards</span>
          <span className="block text-sm text-papel/70">Troca os nomes das pessoas por iniciais antes de compartilhar.</span>
        </span>
        <input
          type="checkbox"
          checked={esconderNomes}
          onChange={(e) => setEsconderNomes(e.target.checked)}
          className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-white/20 transition before:block before:h-5 before:w-5 before:translate-x-0.5 before:rounded-full before:bg-papel before:transition checked:bg-rosa checked:before:translate-x-[22px]"
        />
      </label>

      <button
        onClick={() => irPara("stories")}
        disabled={todos.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-lima px-6 py-4 text-lg font-extrabold text-tinta shadow-[0_10px_40px_-10px] shadow-lima/60 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
      >
        <Play className="h-5 w-5 fill-current" /> Ver meu Retrospix
      </button>
      <button onClick={recomecar} className="w-full text-sm font-semibold text-papel/60 transition hover:text-papel">
        Começar de novo com outro arquivo
      </button>
    </div>
  );
}
