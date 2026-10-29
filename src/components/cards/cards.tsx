"use client";

import type { ReactNode } from "react";
import type { Retrospectiva } from "@/lib/analise/retrospectiva";
import { iniciais } from "@/lib/parse/texto";
import { DIAS_DA_SEMANA, dataCurta, diaPorExtenso, mesCurto, nomeDoMes, nomeDoPeriodo, numero, plural, reais } from "@/lib/formatar";
import type { CardId } from "@/lib/roteiro";
import { Carimbo, Contador, Linha, Losango, Moldura, ordem, type Tema } from "./base";

export type PropsCard = {
  r: Retrospectiva;
  animar: boolean;
  esconder: boolean;
  indice: number;
  total: number;
};

const TEMAS: Record<CardId, Tema> = {
  abertura: {
    fundo: "radial-gradient(90% 55% at 100% 0%, #32bcad88, transparent 70%), radial-gradient(80% 50% at 0% 100%, #7c5cff99, transparent 70%), #100c1f",
    texto: "#fff6e6",
    destaque: "#c8f169",
  },
  pix: { fundo: "linear-gradient(160deg, #3fd3c2 0%, #1f9e91 45%, #0b5c55 100%)", texto: "#fff6e6", destaque: "#fff6e6" },
  pessoas: { fundo: "linear-gradient(165deg, #ff7aa1 0%, #ff4f80 40%, #b5134f 100%)", texto: "#fff6e6", destaque: "#fff6e6" },
  calendario: { fundo: "linear-gradient(170deg, #ffb057 0%, #ff7a2f 45%, #d93a1f 100%)", texto: "#1a0c05", destaque: "#1a0c05" },
  madrugada: {
    fundo: "radial-gradient(70% 40% at 80% 12%, #6b4dff55, transparent 70%), linear-gradient(180deg, #0b0828 0%, #1d1452 60%, #3a1f78 100%)",
    texto: "#f2edff",
    destaque: "#ffd23f",
  },
  semana: { fundo: "linear-gradient(165deg, #ffe066 0%, #ffd23f 45%, #ff9f1c 100%)", texto: "#1d1300", destaque: "#1d1300" },
  delivery: { fundo: "linear-gradient(165deg, #ff6a4d 0%, #ff3b30 45%, #a50f2d 100%)", texto: "#fff6e6", destaque: "#fff6e6" },
  transporte: {
    fundo: "repeating-linear-gradient(115deg, transparent 0 9cqw, #ffffff08 9cqw 18cqw), linear-gradient(180deg, #121212 0%, #050505 100%)",
    texto: "#f5f5f5",
    destaque: "#c8f169",
  },
  assinaturas: { fundo: "linear-gradient(165deg, #9a83ff 0%, #6a47ff 45%, #3011a8 100%)", texto: "#fff6e6", destaque: "#fff6e6" },
  comparacoes: { fundo: "linear-gradient(165deg, #e2ff8f 0%, #c8f169 40%, #6fcf4a 100%)", texto: "#0f1a05", destaque: "#0f1a05" },
  final: {
    fundo: "radial-gradient(70% 45% at 15% 10%, #ff5c8acc, transparent 70%), radial-gradient(70% 45% at 95% 45%, #32bcadcc, transparent 70%), radial-gradient(80% 50% at 20% 100%, #7c5cffdd, transparent 70%), #100c1f",
    texto: "#fff6e6",
    destaque: "#c8f169",
  },
};

const nomePessoa = (nome: string, esconder: boolean) => (esconder ? iniciais(nome) : nome);
const primeiroNome = (nome: string, esconder: boolean) => (esconder ? "Essa pessoa" : nome.split(" ")[0]);

function Kicker({ children, i = 0 }: { children: ReactNode; i?: number }) {
  return (
    <p className="entra font-mono text-[3.2cqw] font-bold uppercase tracking-[0.18em] opacity-80" style={ordem(i)}>
      {children}
    </p>
  );
}

function Grande({ children, i = 1, cor, tamanho = "text-[15cqw]" }: { children: ReactNode; i?: number; cor?: string; tamanho?: string }) {
  return (
    <p className={`entra font-display ${tamanho} font-extrabold leading-[0.92] tracking-[-0.04em]`} style={{ ...ordem(i), color: cor }}>
      {children}
    </p>
  );
}

function Texto({ children, i = 2, className = "" }: { children: ReactNode; i?: number; className?: string }) {
  return (
    <p className={`entra text-[5.4cqw] font-semibold leading-[1.15] tracking-[-0.01em] ${className}`} style={ordem(i)}>
      {children}
    </p>
  );
}

function Ticket({ children, i = 4, titulo, className = "" }: { children: ReactNode; i?: number; titulo?: string; className?: string }) {
  return (
    <div className={`entra ticket px-[5cqw] py-[4.5cqw] text-[3.3cqw] leading-[1.7] ${className}`} style={ordem(i)}>
      {titulo && <p className="mb-[1.5cqw] text-center text-[2.8cqw] font-bold uppercase tracking-[0.25em] opacity-70">{titulo}</p>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Abertura({ r, animar, indice, total }: PropsCard) {
  const t = TEMAS.abertura;
  const periodo = nomeDoPeriodo(r.periodo.inicio, r.periodo.fim);
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      <Kicker>Seu {r.periodo.ano && periodo === String(r.periodo.ano) ? "ano" : "período"} em Pix · {periodo}</Kicker>
      <Texto i={1} className="mt-[6cqw] text-[7cqw]">
        Saíram da sua conta
      </Texto>
      <Grande i={2} cor={t.destaque} tamanho="text-[16cqw]">
        <Contador valor={r.gastos} animar={animar} formato={(n) => reais(n, false)} />
      </Grande>
      <Texto i={3} className="mt-[2cqw]">
        em {plural(r.lancamentos, "lançamento", "lançamentos")}, de {dataCurta(r.periodo.inicio)} a {dataCurta(r.periodo.fim)}.
      </Texto>
      <Ticket i={5} titulo="Resumo" className="mt-[9cqw]">
        <Linha rotulo="Entrou" valor={reais(r.entradas, false)} />
        <Linha rotulo="Saiu" valor={reais(r.gastos, false)} />
        <div className="linha-pontilhada my-[1.5cqw]" />
        <Linha forte rotulo="Saldo" valor={`${r.entradas - r.gastos >= 0 ? "+" : "−"}${reais(Math.abs(r.entradas - r.gastos), false)}`} />
      </Ticket>
      <Texto i={7} className="mt-[7cqw] text-[6cqw] font-extrabold">
        Bora ver para onde foi? →
      </Texto>
    </Moldura>
  );
}

function Pix({ r, animar, esconder, indice, total }: PropsCard) {
  const t = TEMAS.pix;
  const generoso = r.pix.enviado >= r.pix.recebido;
  const maior = r.pix.maiorEnviado;
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      <Kicker>Pix</Kicker>
      <Texto i={1} className="mt-[4cqw] text-[7cqw]">
        Você mandou
      </Texto>
      <Grande i={2}>
        <Contador valor={r.pix.enviado} animar={animar} formato={(n) => reais(n, false)} />
      </Grande>
      <Texto i={3}>em {plural(r.pix.enviados, "Pix", "Pix")}</Texto>
      <Texto i={4} className="mt-[5cqw] text-[7cqw]">
        e recebeu
      </Texto>
      <Grande i={5} tamanho="text-[11cqw]">
        <Contador valor={r.pix.recebido} animar={animar} formato={(n) => reais(n, false)} />
      </Grande>
      <Ticket i={6} titulo="Comprovante do período" className="mt-[7cqw]">
        <Linha rotulo="Pix enviados" valor={numero(r.pix.enviados)} />
        <Linha rotulo="Pix recebidos" valor={numero(r.pix.recebidos)} />
        <Linha rotulo="Pessoas diferentes" valor={numero(r.pix.pessoasDiferentes)} />
        {maior && (
          <>
            <div className="linha-pontilhada my-[1.5cqw]" />
            <Linha forte rotulo={`Maior: ${maior.pessoa ? nomePessoa(maior.nome, esconder) : maior.nome}`} valor={reais(maior.valor)} />
          </>
        )}
      </Ticket>
      <Texto i={8} className="mt-[6cqw] text-[5.6cqw] font-extrabold">
        {generoso ? "Generosidade é o seu sobrenome." : "Entra mais do que sai. Ensina?"}
      </Texto>
    </Moldura>
  );
}

function Pessoas({ r, animar, esconder, indice, total }: PropsCard) {
  const t = TEMAS.pessoas;
  const [primeira, ...resto] = r.pix.paraQuem;
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      <Kicker>Para quem você mais mandou Pix</Kicker>
      <div className="entra mt-[6cqw] flex items-baseline gap-[3cqw]" style={ordem(1)}>
        <span className="font-mono text-[9cqw] font-bold opacity-60">#1</span>
        <Carimbo cor="#fff6e6" i={3}>
          {plural(primeira.vezes, "Pix", "Pix")}
        </Carimbo>
      </div>
      <Grande i={2} tamanho={primeira.nome.length > 18 && !esconder ? "text-[10.5cqw]" : "text-[13cqw]"}>
        {nomePessoa(primeira.nome, esconder)}
      </Grande>
      <Texto i={3} className="mt-[2cqw] text-[7cqw] font-extrabold">
        <Contador valor={primeira.total} animar={animar} formato={(n) => reais(n)} />
      </Texto>
      {resto.length > 0 && (
        <Ticket i={5} titulo="O resto do pódio" className="mt-[7cqw]">
          {resto.map((p, i) => (
            <Linha key={p.chave} rotulo={`#${i + 2} ${nomePessoa(p.nome, esconder)}`} valor={reais(p.total, false)} />
          ))}
        </Ticket>
      )}
      <Texto i={8} className="mt-[6cqw] text-[5.6cqw] font-extrabold">
        {primeiroNome(primeira.nome, esconder)} merece um café. Ou vários.
      </Texto>
    </Moldura>
  );
}

function Calendario({ r, animar, esconder, indice, total }: PropsCard) {
  const t = TEMAS.calendario;
  const dia = r.diaMaisCaro!;
  const variosMeses = r.meses.length >= 2 && r.mesMaisCaro;
  const maior = Math.max(...r.meses.map((m) => m.gasto), 1);
  const culpado = dia.principal.pessoa ? nomePessoa(dia.principal.nome, esconder) : dia.principal.nome;
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      {variosMeses ? (
        <>
          <Kicker>Seu mês mais caro foi</Kicker>
          <Grande i={1} tamanho="text-[17cqw]">
            {nomeDoMes(r.mesMaisCaro!.mes)}
          </Grande>
          <Texto i={2} className="text-[7cqw] font-extrabold">
            <Contador valor={r.mesMaisCaro!.gasto} animar={animar} formato={(n) => reais(n, false)} />
          </Texto>
          <div className="mt-[6cqw] flex h-[26cqw] items-end gap-[1.2cqw]" aria-hidden>
            {r.meses.map((m, i) => (
              <div key={m.mes} className="flex h-full flex-1 flex-col items-center justify-end gap-[1cqw]">
                <div
                  className="barra-v w-full rounded-t-[1cqw]"
                  style={{
                    ...ordem(i),
                    height: `${Math.max(3, (m.gasto / maior) * 100)}%`,
                    background: m.mes === r.mesMaisCaro!.mes ? "#1a0c05" : "#1a0c0540",
                  }}
                />
                <span className="font-mono text-[2.4cqw] font-bold uppercase">{mesCurto(m.mes).charAt(0)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <Kicker>Seu dia mais caro foi</Kicker>
          <Grande i={1} tamanho="text-[15cqw]">
            {diaPorExtenso(dia.data)}
          </Grande>
        </>
      )}
      <Ticket i={6} titulo="O dia mais caro" className="mt-[7cqw]">
        <Linha forte rotulo={diaPorExtenso(dia.data)} valor={reais(dia.gasto, false)} />
        <Linha rotulo="Lançamentos no dia" valor={numero(dia.vezes)} />
        <div className="linha-pontilhada my-[1.5cqw]" />
        <Linha rotulo={`Culpado: ${culpado}`} valor={reais(dia.principal.valor, false)} />
      </Ticket>
    </Moldura>
  );
}

function Madrugada({ r, animar, indice, total }: PropsCard) {
  const t = TEMAS.madrugada;
  const m = r.madrugada!;
  const estrelas = [
    [12, 14], [78, 9], [64, 22], [22, 30], [88, 34], [40, 8], [8, 52], [92, 62], [55, 40],
  ];
  return (
    <Moldura
      tema={t}
      animar={animar}
      indice={indice}
      total={total}
      enfeite={
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {estrelas.map(([x, y], i) => (
            <span
              key={i}
              className="estrela absolute rounded-full bg-white"
              style={{ left: `${x}%`, top: `${y}%`, width: `${i % 3 ? 0.8 : 1.3}cqw`, height: `${i % 3 ? 0.8 : 1.3}cqw`, ...ordem(i) }}
            />
          ))}
          <div className="flutua absolute right-[9cqw] top-[18cqw] h-[20cqw] w-[20cqw] rounded-full shadow-[inset_-5cqw_-1cqw_0_0_#ffd23f]" />
        </div>
      }
    >
      <Kicker>Entre meia-noite e 5h da manhã</Kicker>
      <Texto i={1} className="mt-[4cqw] text-[7cqw]">
        você gastou
      </Texto>
      <Grande i={2} cor={t.destaque}>
        <Contador valor={m.total} animar={animar} formato={(n) => reais(n, false)} />
      </Grande>
      <Texto i={3}>
        em {plural(m.vezes, "compra", "compras")}.{m.horaMaisTarde && <> A mais tardia foi às {m.horaMaisTarde}.</>}
      </Texto>
      {m.top.length > 0 && (
        <Ticket i={5} titulo="Os parceiros da madrugada" className="mt-[7cqw]">
          {m.top.map((l) => (
            <Linha key={l.nome} rotulo={l.nome} valor={reais(l.total, false)} />
          ))}
        </Ticket>
      )}
      <Texto i={7} className="mt-[6cqw] text-[5.6cqw] font-extrabold">
        O seu cartão não conhece a hora de dormir.
      </Texto>
    </Moldura>
  );
}

function Semana({ r, animar, indice, total }: PropsCard) {
  const t = TEMAS.semana;
  const s = r.semana;
  const razao = s.mediaDiaUtil > 0 ? s.mediaFimDeSemana / s.mediaDiaUtil : 0;
  const mais = razao >= 1;
  const maior = Math.max(s.mediaFimDeSemana, s.mediaDiaUtil, 1);
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      <Kicker>Fim de semana × dia útil</Kicker>
      <Texto i={1} className="mt-[4cqw] text-[7cqw]">
        No fim de semana, você gasta
      </Texto>
      <Grande i={2} tamanho="text-[19cqw]">
        {numero(mais ? razao : 1 / Math.max(razao, 0.01), 1)}×
      </Grande>
      <Texto i={3} className="text-[7cqw] font-extrabold">
        {mais ? "mais" : "menos"} por dia
      </Texto>
      <div className="mt-[8cqw] flex flex-col gap-[3cqw] font-mono text-[3.4cqw] font-bold">
        {[
          ["Sábado e domingo", s.mediaFimDeSemana],
          ["Segunda a sexta", s.mediaDiaUtil],
        ].map(([rotulo, v], i) => (
          <div key={rotulo as string} className="entra" style={ordem(4 + i)}>
            <div className="mb-[1cqw] flex justify-between">
              <span>{rotulo}</span>
              <span>
                <Contador valor={v as number} animar={animar} formato={(n) => reais(n)} />
                /dia
              </span>
            </div>
            <div className="h-[5cqw] rounded-full bg-black/10">
              <div className="barra-h h-full rounded-full bg-[#1d1300]" style={{ width: `${((v as number) / maior) * 100}%`, ...ordem(4 + i) }} />
            </div>
          </div>
        ))}
      </div>
      <Texto i={7} className="mt-[8cqw] text-[5.6cqw] font-extrabold">
        O dia mais caro da semana: {DIAS_DA_SEMANA[s.diaMaisCaro]}.
      </Texto>
    </Moldura>
  );
}

function Delivery({ r, animar, indice, total }: PropsCard) {
  const t = TEMAS.delivery;
  const d = r.delivery;
  const comp = r.comparacoes.find((c) => c.sujeito === "Seu delivery");
  const cadaQuantos = d.vezes ? r.periodo.dias / d.vezes : 0;
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      <Kicker>Delivery</Kicker>
      <Texto i={1} className="mt-[4cqw] text-[7cqw]">
        Em delivery, foram
      </Texto>
      <Grande i={2}>
        <Contador valor={d.total} animar={animar} formato={(n) => reais(n, false)} />
      </Grande>
      <Texto i={3}>
        em {plural(d.vezes, "pedido", "pedidos")}
        {cadaQuantos >= 1 && cadaQuantos < 60 ? `: um a cada ${numero(cadaQuantos, cadaQuantos < 10 ? 1 : 0)} dias.` : "."}
      </Texto>
      <Ticket i={5} titulo="Pedido do período" className="mt-[7cqw]">
        {d.top.map((l) => (
          <Linha key={l.nome} rotulo={`${l.nome} (${l.vezes}×)`} valor={reais(l.total, false)} />
        ))}
        <div className="linha-pontilhada my-[1.5cqw]" />
        <Linha rotulo="Ticket médio" valor={reais(d.ticketMedio)} />
      </Ticket>
      {comp && (
        <Texto i={7} className="mt-[6cqw] text-[6.4cqw] font-extrabold">
          Isso dava {comp.texto}.
        </Texto>
      )}
    </Moldura>
  );
}

function Transporte({ r, animar, indice, total }: PropsCard) {
  const t = TEMAS.transporte;
  const d = r.transporte;
  const comp = r.comparacoes.find((c) => c.sujeito === "Seus apps de transporte");
  const cores = ["#c8f169", "#ffd23f", "#32bcad", "#ff5c8a"];
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      <Kicker>Transporte por app</Kicker>
      <Texto i={1} className="mt-[4cqw] text-[7cqw]">
        Você rodou
      </Texto>
      <Grande i={2} cor={t.destaque}>
        <Contador valor={d.total} animar={animar} formato={(n) => reais(n, false)} />
      </Grande>
      <Texto i={3}>
        em {plural(d.vezes, "corrida", "corridas")}, com média de {reais(d.ticketMedio)}.
      </Texto>
      <div className="entra mt-[8cqw]" style={ordem(4)}>
        <div className="flex h-[7cqw] overflow-hidden rounded-[1.5cqw]">
          {d.top.map((l, i) => (
            <div key={l.nome} className="barra-h h-full" style={{ width: `${(l.total / d.total) * 100}%`, background: cores[i], ...ordem(4 + i) }} />
          ))}
        </div>
        <div className="mt-[2.5cqw] flex flex-wrap gap-x-[5cqw] gap-y-[1cqw] font-mono text-[3.3cqw] font-bold">
          {d.top.map((l, i) => (
            <span key={l.nome} className="flex items-center gap-[1.5cqw]">
              <span className="inline-block h-[2.6cqw] w-[2.6cqw] rounded-full" style={{ background: cores[i] }} />
              {l.nome} · {numero((l.total / d.total) * 100)}%
            </span>
          ))}
        </div>
      </div>
      {comp && (
        <Texto i={7} className="mt-[9cqw] text-[6.4cqw] font-extrabold">
          Com esse dinheiro, dava para comprar <span style={{ color: t.destaque }}>{comp.texto}</span>.
        </Texto>
      )}
    </Moldura>
  );
}

function Assinaturas({ r, animar, indice, total }: PropsCard) {
  const t = TEMAS.assinaturas;
  const a = r.assinaturas;
  const lista = a.itens.slice(0, 6);
  const esquecida = a.esquecidas[0];
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      <Kicker>Assinaturas e cobranças mensais</Kicker>
      <Texto i={1} className="mt-[4cqw] text-[7cqw]">
        Elas custam
      </Texto>
      <Grande i={2}>
        <Contador valor={a.mensal} animar={animar} formato={(n) => reais(n)} />
      </Grande>
      <Texto i={3}>por mês, ou {reais(a.anual, false)} por ano.</Texto>
      <Ticket i={5} titulo="Cobrança recorrente" className="relative mt-[7cqw]">
        {lista.map((s) => (
          <Linha
            key={s.chave}
            rotulo={
              <>
                {s.nome}
                {s.esquecida && <span className="ml-[1.5cqw] rounded-[0.8cqw] bg-[#ff5c8a] px-[1cqw] text-[2.4cqw] font-bold uppercase text-white">esqueceu?</span>}
              </>
            }
            valor={reais(s.valor)}
          />
        ))}
        {a.itens.length > lista.length && <p className="mt-[1cqw] text-center opacity-60">e mais {a.itens.length - lista.length}</p>}
      </Ticket>
      <Texto i={8} className="mt-[6cqw] text-[5.6cqw] font-extrabold">
        {esquecida ? `Você ainda usa ${esquecida.nome}?` : "Todas em uso, certo?"}
      </Texto>
    </Moldura>
  );
}

function Comparacoes({ r, animar, indice, total }: PropsCard) {
  const t = TEMAS.comparacoes;
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      <Kicker>Colocando em perspectiva</Kicker>
      <Grande i={1} tamanho="text-[11cqw]">
        Com esse dinheiro, dava para pagar…
      </Grande>
      <div className="mt-[7cqw] flex flex-col gap-[5cqw]">
        {r.comparacoes.slice(0, 3).map((c, i) => (
          <div key={c.sujeito} className="entra" style={ordem(3 + i)}>
            <p className="font-mono text-[3.3cqw] font-bold uppercase tracking-wider opacity-70">
              {c.sujeito} · {reais(c.valor, false)}
            </p>
            <p className="text-[8.5cqw] font-extrabold leading-[1] tracking-[-0.03em]">{c.texto}</p>
          </div>
        ))}
      </div>
      <p className="entra mt-[7cqw] font-mono text-[2.8cqw] opacity-60" style={ordem(7)}>
        Valores de referência aproximados: aluguel R$ 1.800, cesta básica R$ 850, gasolina R$ 6,40/l.
      </p>
    </Moldura>
  );
}

function Final({ r, animar, esconder, indice, total }: PropsCard) {
  const t = TEMAS.final;
  const top = r.pix.paraQuem[0];
  return (
    <Moldura tema={t} animar={animar} indice={indice} total={total}>
      <Kicker>A sua persona financeira</Kicker>
      <Grande i={1} cor={t.destaque} tamanho="text-[15cqw]">
        {r.persona.titulo}
      </Grande>
      <Texto i={2} className="mt-[3cqw] text-[6.4cqw]">
        {r.persona.frase}
      </Texto>
      <Ticket i={4} titulo={`Retrospix · ${nomeDoPeriodo(r.periodo.inicio, r.periodo.fim)}`} className="mt-[8cqw]">
        <Linha rotulo="Gastos" valor={reais(r.gastos, false)} />
        {r.pix.enviados > 0 && <Linha rotulo="Pix enviados" valor={reais(r.pix.enviado, false)} />}
        {top && <Linha rotulo="Pix favorito" valor={nomePessoa(top.nome, esconder).split(" ").slice(0, 2).join(" ")} />}
        {r.mesMaisCaro && r.meses.length > 1 && <Linha rotulo="Mês mais caro" valor={nomeDoMes(r.mesMaisCaro.mes)} />}
        {r.delivery.total > 0 && <Linha rotulo="Delivery" valor={reais(r.delivery.total, false)} />}
        {r.assinaturas.mensal > 0 && <Linha rotulo="Assinaturas/mês" valor={reais(r.assinaturas.mensal)} />}
        <div className="linha-pontilhada my-[1.5cqw]" />
        <p className="text-center text-[2.8cqw] uppercase tracking-[0.2em] opacity-70">Obrigado pela preferência</p>
      </Ticket>
      <div className="entra mt-[7cqw] flex items-center gap-[3cqw]" style={ordem(7)}>
        <Losango className="h-[8cqw] w-[8cqw] shrink-0" />
        <p className="text-[5cqw] font-extrabold leading-tight">
          Faça o seu em
          <br />
          <span style={{ color: t.destaque }}>retrospix.joaovaz.dev</span>
        </p>
      </div>
    </Moldura>
  );
}

const CARDS: Record<CardId, (p: PropsCard) => ReactNode> = {
  abertura: Abertura,
  pix: Pix,
  pessoas: Pessoas,
  calendario: Calendario,
  madrugada: Madrugada,
  semana: Semana,
  delivery: Delivery,
  transporte: Transporte,
  assinaturas: Assinaturas,
  comparacoes: Comparacoes,
  final: Final,
};

export function Card({ id, ...props }: PropsCard & { id: CardId }) {
  const Componente = CARDS[id];
  return <Componente {...props} />;
}

export const NOMES_DOS_CARDS: Record<CardId, string> = {
  abertura: "abertura",
  pix: "pix",
  pessoas: "pessoas",
  calendario: "mes-mais-caro",
  madrugada: "madrugada",
  semana: "fim-de-semana",
  delivery: "delivery",
  transporte: "transporte",
  assinaturas: "assinaturas",
  comparacoes: "comparacoes",
  final: "final",
};
