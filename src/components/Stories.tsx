"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Images, RotateCcw, Share2, X } from "lucide-react";
import type { Retrospectiva } from "@/lib/analise/retrospectiva";
import { baixar, cardParaPng, compartilhar, LARGURA } from "@/lib/exportar";
import { roteiro } from "@/lib/roteiro";
import { Card, NOMES_DOS_CARDS } from "./cards/cards";

const DURACAO = 9; // segundos por card

export function Stories({ r, esconder, onFechar }: { r: Retrospectiva; esconder: boolean; onFechar: () => void }) {
  const cards = roteiro(r);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const palco = useRef<(HTMLDivElement | null)[]>([]);
  const toque = useRef<{ inicio: number; segurando: boolean; timer: number } | null>(null);
  const podeCompartilhar = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

  const ultimo = atual === cards.length - 1;
  const irPara = (i: number) => {
    setAtual(Math.max(0, Math.min(cards.length - 1, i)));
    setPausado(false);
  };
  const proximo = () => irPara(atual + 1);
  const anterior = () => irPara(atual - 1);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setAtual((a) => Math.min(cards.length - 1, a + 1));
        setPausado(false);
      } else if (e.key === "ArrowLeft") {
        setAtual((a) => Math.max(0, a - 1));
        setPausado(false);
      }
      else if (e.key === "Escape") onFechar();
      else if (e.key === " ") {
        e.preventDefault();
        setPausado((p) => !p);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [cards.length, onFechar]);

  // trava a rolagem da página enquanto os stories estão abertos
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2600);
    return () => clearTimeout(t);
  }, [aviso]);

  const nomeDoArquivo = (i: number) => `retrospix-${String(i + 1).padStart(2, "0")}-${NOMES_DOS_CARDS[cards[i]]}.png`;

  async function exportar(modo: "compartilhar" | "baixar") {
    const no = palco.current[atual];
    if (!no || ocupado) return;
    setOcupado(true);
    setPausado(true);
    try {
      const png = await cardParaPng(no);
      if (modo === "baixar") {
        baixar(png, nomeDoArquivo(atual));
        setAviso("Imagem salva");
      } else {
        const res = await compartilhar(png, nomeDoArquivo(atual));
        if (res === "baixado") setAviso("Imagem salva");
      }
    } catch {
      setAviso("Não deu para gerar a imagem. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  async function baixarTodos() {
    if (ocupado) return;
    setOcupado(true);
    setPausado(true);
    try {
      for (let i = 0; i < cards.length; i++) {
        const no = palco.current[i];
        if (!no) continue;
        baixar(await cardParaPng(no), nomeDoArquivo(i));
      }
      setAviso(`${cards.length} imagens salvas`);
    } catch {
      setAviso("Não deu para gerar as imagens. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  // Toque rápido troca de card; segurar pausa, como nos stories.
  function aoApertar() {
    const timer = window.setTimeout(() => {
      if (toque.current) toque.current.segurando = true;
      setPausado(true);
    }, 220);
    toque.current = { inicio: Date.now(), segurando: false, timer };
  }
  function aoSoltar(e: React.PointerEvent<HTMLDivElement>) {
    const t = toque.current;
    toque.current = null;
    if (!t) return;
    clearTimeout(t.timer);
    if (t.segurando) {
      setPausado(false);
      return;
    }
    const caixa = e.currentTarget.getBoundingClientRect();
    if (e.clientX - caixa.left < caixa.width * 0.3) anterior();
    else proximo();
  }

  function aoCancelar() {
    const t = toque.current;
    toque.current = null;
    if (!t) return;
    clearTimeout(t.timer);
    if (t.segurando) setPausado(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07050f]/95 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Sua retrospectiva"
    >
      <div className="relative flex w-full flex-1 items-center justify-center gap-6 sm:py-4">
        <button
          onClick={anterior}
          disabled={atual === 0}
          className="hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-20 md:flex"
          aria-label="Card anterior"
        >
          <ChevronLeft />
        </button>

        <div
          className={`relative w-[min(100vw,calc((100dvh-92px)*9/16),480px)] select-none overflow-hidden sm:rounded-3xl sm:shadow-2xl sm:shadow-black/60 ${pausado ? "pausado" : ""}`}
          data-testid="story"
          data-card={cards[atual]}
        >
          <div onPointerDown={aoApertar} onPointerUp={aoSoltar} onPointerLeave={aoCancelar} onPointerCancel={aoCancelar} className="touch-manipulation">
            <Card key={cards[atual]} id={cards[atual]} r={r} animar esconder={esconder} indice={atual} total={cards.length} />
          </div>

          {/* barrinhas de progresso */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex gap-1 p-2.5">
            {cards.map((c, i) => (
              <div key={c} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                {i < atual && <div className="h-full w-full bg-white" />}
                {i === atual && (
                  <div
                    key={`p-${atual}`}
                    className="barra-progresso h-full w-full bg-white"
                    style={{ "--duracao": `${DURACAO}s` } as React.CSSProperties}
                    onAnimationEnd={() => !ultimo && proximo()}
                  />
                )}
              </div>
            ))}
          </div>
          {aviso && (
            <div className="absolute inset-x-0 bottom-6 z-30 flex justify-center" role="status">
              <span className="rounded-full bg-black/75 px-4 py-2 text-sm font-semibold text-white">{aviso}</span>
            </div>
          )}
        </div>

        <button
          onClick={proximo}
          disabled={ultimo}
          className="hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-20 md:flex"
          aria-label="Próximo card"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="flex h-[92px] w-full max-w-[480px] items-center justify-center gap-2 px-4 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={onFechar}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          onClick={() => exportar(podeCompartilhar ? "compartilhar" : "baixar")}
          disabled={ocupado}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-papel font-bold text-tinta transition active:scale-95 disabled:opacity-60"
        >
          {podeCompartilhar ? <Share2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          {ocupado ? "Gerando…" : podeCompartilhar ? "Compartilhar" : "Baixar imagem"}
        </button>
        {podeCompartilhar && (
          <button
            onClick={() => exportar("baixar")}
            disabled={ocupado}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-60"
            aria-label="Baixar imagem"
          >
            <Download className="h-5 w-5" />
          </button>
        )}
        {ultimo && (
          <>
            <button
              onClick={baixarTodos}
              disabled={ocupado}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-60"
              aria-label="Baixar todos os cards"
              title="Baixar todos os cards"
            >
              <Images className="h-5 w-5" />
            </button>
            <button
              onClick={() => irPara(0)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Ver de novo"
              title="Ver de novo"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Palco fora da tela: cada card em 1080×1920, parado, pronto para virar PNG. */}
      <div aria-hidden inert className="pointer-events-none fixed left-[-20000px] top-0" style={{ width: LARGURA }}>
        {cards.map((c, i) => (
          <div key={c} ref={(el) => { palco.current[i] = el; }} style={{ width: LARGURA }} data-exportar={c}>
            <Card id={c} r={r} animar={false} esconder={esconder} indice={i} total={cards.length} />
          </div>
        ))}
      </div>
    </div>
  );
}
