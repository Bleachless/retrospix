import { CloudOff, Cpu, EyeOff, Plane } from "lucide-react";
import { App } from "@/components/App";
import { Losango } from "@/components/cards/base";
import { Vigia } from "@/components/Vigia";
import { Vitrine } from "@/components/Vitrine";
import { calcular } from "@/lib/analise/retrospectiva";
import { BANCOS } from "@/lib/bancos";
import { gerarDemo } from "@/lib/demo";

export const ensureStatic = "navigation";

const REPO = "https://github.com/Bleachless/retrospix";

const GARANTIAS = [
  {
    icone: Cpu,
    titulo: "Lido aqui mesmo",
    texto: "O navegador abre o arquivo como abre uma foto da galeria. A conta é feita no seu celular ou computador.",
  },
  {
    icone: CloudOff,
    titulo: "Nada é enviado",
    texto: "Não existe servidor que receba extrato. E a página é proibida, pelo próprio navegador, de mandar dados para fora (CSP connect-src 'self').",
  },
  {
    icone: EyeOff,
    titulo: "Sem rastreio",
    texto: "Sem analytics, sem cookies e sem salvar nada. Fechou a aba, o extrato some da memória.",
  },
  {
    icone: Plane,
    titulo: "Teste no modo avião",
    texto: "Depois que a página carregar, ligue o modo avião e suba o extrato. Funciona do mesmo jeito.",
  },
];

function GitHub({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export default function Pagina() {
  const demo = calcular(gerarDemo());
  return (
    <main className="fundo-pagina min-h-dvh overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.2em]">
          <Losango className="h-5 w-5 text-lima" /> retrospix
        </span>
        <a href={REPO} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-papel/80 transition hover:bg-white/10 hover:text-papel">
          <GitHub className="h-4 w-4" /> código aberto
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-4 lg:grid-cols-[1.05fr_1fr] lg:pt-10">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-lima/15 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.15em] text-lima">
            Retrospectiva do seu dinheiro
          </p>
          <h1 className="text-[clamp(2.9rem,9vw,5.6rem)] font-extrabold leading-[0.9] tracking-[-0.045em]">
            Seu ano
            <br />
            em <span className="text-pix">Pix</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-papel/80">
            Suba o extrato do banco e ganhe stories prontos para compartilhar: para quem você mais mandou Pix, o mês mais
            caro, quanto foi de iFood e as assinaturas que você esqueceu que paga.
          </p>
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-pix/10 p-4 ring-1 ring-pix/30">
            <Losango className="mt-0.5 h-6 w-6 shrink-0 text-pix" />
            <p className="text-[15px] leading-snug">
              <strong className="font-extrabold">Seu extrato não sai deste aparelho.</strong> Ele é lido pelo próprio
              navegador. Nada é enviado, nada fica salvo.
            </p>
          </div>
          <div className="mt-6 max-w-xl">
            <App />
          </div>
        </div>
        <div className="hidden sm:block">
          <Vitrine r={demo} />
        </div>
      </section>

      <section id="privacidade" className="border-y border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="max-w-2xl text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">
            Extrato é coisa séria. Por isso ele fica com você.
          </h2>
          <div className="mt-4">
            <Vigia />
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GARANTIAS.map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo} className="rounded-3xl bg-white/[0.05] p-6 ring-1 ring-white/10">
                <Icone className="h-7 w-7 text-lima" />
                <h3 className="mt-4 text-xl font-extrabold">{titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-papel/75">{texto}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-papel/60">
            Não acredita? O <a href={REPO} className="font-semibold text-papel underline underline-offset-4">código é aberto</a>, e dá
            para conferir na aba Rede do navegador que nenhuma requisição sai quando você escolhe o arquivo.
          </p>
        </div>
      </section>

      <section id="bancos" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-4xl font-extrabold leading-[1] tracking-[-0.03em] sm:text-5xl">Como tirar o extrato</h2>
        <p className="mt-3 max-w-2xl text-papel/75">
          Exporte em OFX (o melhor) ou CSV. Os menus dos apps mudam de vez em quando: procure por Exportar ou Baixar
          extrato. Dá para juntar conta e cartão, ou mais de um banco.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BANCOS.map((b) => (
            <details key={b.id} className="group rounded-2xl bg-white/[0.05] ring-1 ring-white/10 open:bg-white/[0.08]">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: b.cor }} />
                <span className="flex-1 font-bold">{b.nome}</span>
                <span className="font-mono text-xs text-papel/60">{b.formatos.join(" · ")}</span>
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-papel/75">{b.passos}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-5 pb-10 pt-6 text-sm text-papel/60 sm:flex-row sm:justify-between">
        <span>
          Feito por <a href="https://joaovaz.dev" className="font-semibold text-papel hover:underline">João Vaz</a>. Não é um app de
          banco e não tem ligação com nenhum deles.
        </span>
        <span>As comparações usam preços de referência aproximados.</span>
      </footer>
    </main>
  );
}
