"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

export type Tema = {
  fundo: string;
  texto: string;
  /** Cor de destaque dos números grandes. */
  destaque: string;
};

/** Número que sobe contando quando o card entra. No PNG, já vem pronto. */
export function useContagem(alvo: number, animar: boolean, duracao = 1400): number {
  const [valor, setValor] = useState(animar ? 0 : alvo);
  useEffect(() => {
    if (!animar) return;
    let quadro = 0;
    const inicio = performance.now() + 250;
    const passo = (agora: number) => {
      const p = Math.min(1, Math.max(0, (agora - inicio) / duracao));
      setValor(alvo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, animar, duracao]);
  return animar ? valor : alvo;
}

export function Contador({
  valor,
  animar,
  formato,
}: {
  valor: number;
  animar: boolean;
  formato: (n: number) => string;
}) {
  const v = useContagem(valor, animar);
  return <span className="tabular-nums">{formato(v)}</span>;
}

/** Atalho para o atraso escalonado das animações. */
export const ordem = (i: number) => ({ "--i": i }) as CSSProperties;

/** Código de barras falso, mas sempre o mesmo para o mesmo texto. */
export function CodigoDeBarras({ texto, className = "" }: { texto: string; className?: string }) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const barras: number[] = [];
  for (let i = 0; i < 46; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    barras.push(((h >>> 0) % 3) + 1);
  }
  return (
    <div className={`flex h-[5cqw] max-w-[42cqw] items-stretch gap-[0.55cqw] overflow-hidden ${className}`} aria-hidden>
      {barras.map((b, i) => (
        <span key={i} className="bg-current" style={{ width: `${b * 0.35}cqw`, opacity: i % 7 === 3 ? 0.5 : 1 }} />
      ))}
    </div>
  );
}

/** Uma linha de comprovante: "Rótulo ........ valor". */
export function Linha({ rotulo, valor, forte = false }: { rotulo: ReactNode; valor: ReactNode; forte?: boolean }) {
  return (
    <div className={`flex items-end gap-[1.5cqw] ${forte ? "font-bold" : ""}`}>
      <span className="min-w-0 truncate">{rotulo}</span>
      <span className="pontinhos" />
      <span className="shrink-0 tabular-nums">{valor}</span>
    </div>
  );
}

export function Moldura({
  tema,
  animar,
  indice,
  total,
  children,
  enfeite,
}: {
  tema: Tema;
  animar: boolean;
  indice: number;
  total: number;
  children: ReactNode;
  enfeite?: ReactNode;
}) {
  return (
    <div
      className={`card w-full font-display ${animar ? "animado" : ""}`}
      style={{ background: tema.fundo, color: tema.texto }}
    >
      {enfeite}
      <div className="relative z-10 flex h-full flex-col px-[7.5cqw] pb-[6cqw] pt-[11cqw]">
        <header className="flex items-center justify-between font-mono text-[3cqw] uppercase tracking-[0.2em] opacity-80">
          <span className="flex items-center gap-[1.6cqw] font-bold">
            <Losango className="h-[3.6cqw] w-[3.6cqw]" />
            retrospix
          </span>
          <span>
            {String(indice + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col justify-center">{children}</div>
        <footer className="flex items-end justify-between gap-[4cqw] font-mono text-[2.6cqw] opacity-75">
          <span className="leading-tight">
            retrospix.joaovaz.dev
            <br />
            lido no próprio aparelho
          </span>
          <CodigoDeBarras texto={`${indice}-${total}`} />
        </footer>
      </div>
    </div>
  );
}

/** O losango do Pix, de um jeito nosso. */
export function Losango({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 1.5 22.5 12 12 22.5 1.5 12Z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M12 7.5 16.5 12 12 16.5 7.5 12Z" fill="currentColor" />
    </svg>
  );
}

export function Carimbo({ children, cor, i = 0, className = "" }: { children: ReactNode; cor: string; i?: number; className?: string }) {
  return (
    <span
      className={`carimbo inline-block rounded-[1.2cqw] border-[0.6cqw] px-[2cqw] py-[0.6cqw] font-mono text-[2.8cqw] font-bold uppercase tracking-widest ${className}`}
      style={{ color: cor, borderColor: cor, ...ordem(i) }}
    >
      {children}
    </span>
  );
}
