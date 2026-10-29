"use client";

import { calcular } from "@/lib/analise/retrospectiva";
import { juntar } from "@/lib/parse";
import { useRetro } from "@/lib/store";
import { Revisar } from "./Revisar";
import { Stories } from "./Stories";
import { Upload } from "./Upload";

export function App() {
  const etapa = useRetro((s) => s.etapa);
  const arquivos = useRetro((s) => s.arquivos);
  const ignorar = useRetro((s) => s.ignorar);
  const esconderNomes = useRetro((s) => s.esconderNomes);
  const irPara = useRetro((s) => s.irPara);

  if (etapa === "inicio") return <Upload />;

  const r = calcular(juntar(arquivos.map((a) => a.extrato)), { ignorar });
  return (
    <>
      <Revisar />
      {etapa === "stories" && <Stories r={r} esconder={esconderNomes} onFechar={() => irPara("revisar")} />}
    </>
  );
}
