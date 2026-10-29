"use client";

import type { Retrospectiva } from "@/lib/analise/retrospectiva";
import type { CardId } from "@/lib/roteiro";
import { Card } from "./cards/cards";

/** Três cards da demonstração em leque, para mostrar o que vem. */
export function Vitrine({ r }: { r: Retrospectiva }) {
  const amostra: { id: CardId; classe: string }[] = [
    { id: "pessoas", classe: "-rotate-[9deg] -translate-x-[58%] translate-y-6" },
    { id: "delivery", classe: "rotate-[9deg] translate-x-[58%] translate-y-6" },
    { id: "pix", classe: "z-10 -translate-y-2" },
  ];
  return (
    <div className="relative mx-auto flex h-[400px] w-full max-w-[520px] items-start justify-center sm:h-[480px]" aria-hidden>
      {amostra.map(({ id, classe }) => (
        <div key={id} className={`absolute w-[190px] overflow-hidden rounded-[22px] shadow-2xl shadow-black/50 ring-1 ring-white/10 sm:w-[230px] ${classe}`}>
          <Card id={id} r={r} animar={false} esconder={false} indice={["abertura", "pix", "pessoas"].indexOf(id) + 1} total={10} />
        </div>
      ))}
    </div>
  );
}
