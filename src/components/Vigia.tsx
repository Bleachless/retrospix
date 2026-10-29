"use client";

import { useEffect, useState } from "react";

/**
 * Conta, ao vivo, quantos envios de dados (fetch, XHR, beacon) a página fez
 * desde que abriu. É a prova visível de que o extrato não sai daqui.
 */
export function Vigia() {
  const [envios, setEnvios] = useState(0);
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    const tipos = new Set(["fetch", "xmlhttprequest", "beacon"]);
    // Ler as fontes e o código da própria página (para montar o PNG) não é envio.
    const ehArquivoDaPagina = (url: string) => {
      const u = new URL(url, location.href);
      return u.origin === location.origin && u.pathname.startsWith("/_next/");
    };
    const obs = new PerformanceObserver((lista) => {
      const n = lista
        .getEntries()
        .filter((e) => tipos.has((e as PerformanceResourceTiming).initiatorType) && !ehArquivoDaPagina(e.name)).length;
      if (n) setEnvios((v) => v + n);
    });
    obs.observe({ type: "resource", buffered: false });
    return () => obs.disconnect();
  }, []);
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 font-mono text-xs ring-1 ring-white/10" data-testid="vigia">
      <span className={`h-2 w-2 rounded-full ${envios === 0 ? "bg-lima shadow-[0_0_10px] shadow-lima" : "bg-tomate"}`} />
      {envios === 0 ? "0 envios de dados desde que você abriu a página" : `${envios} envio(s) de dados detectado(s)`}
    </span>
  );
}
