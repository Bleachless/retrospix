import type { Lancamento } from "./types";

/**
 * Extrato fictício para o modo demonstração e para os testes de ponta a
 * ponta. Todos os nomes, valores e documentos são inventados. O gerador é
 * determinístico: a mesma semente sempre dá o mesmo extrato.
 */

function sorteador(semente: number) {
  let s = semente >>> 0;
  const proximo = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    numero: proximo,
    entre: (a: number, b: number) => a + proximo() * (b - a),
    inteiro: (a: number, b: number) => Math.floor(a + proximo() * (b - a + 1)),
    um: <T,>(lista: readonly T[]) => lista[Math.floor(proximo() * lista.length)],
    chance: (p: number) => proximo() < p,
  };
}

const AMIGOS = [
  ["MARINA SOUZA LIMA", "•••.481.207-••"],
  ["CAIO HENRIQUE PRADO", "•••.302.118-••"],
  ["BEATRIZ NOGUEIRA ALVES", "•••.775.940-••"],
  ["RAFAEL TAVARES MOURA", "•••.119.563-••"],
  ["LUANA CRISTINA REIS", "•••.640.385-••"],
  ["OTAVIO BRANDAO FILHO", "•••.208.731-••"],
] as const;

const BANCOS = [
  "NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 1234567-8",
  "BCO DO BRASIL S.A. (0001) Agência: 1234 Conta: 56789-0",
  "ITAÚ UNIBANCO S.A. (0341) Agência: 4321 Conta: 98765-4",
  "BANCO INTER (0077) Agência: 1 Conta: 1122334-5",
];

const pix = (enviado: boolean, nome: string, doc: string, banco: string) =>
  `Transferência ${enviado ? "enviada" : "recebida"} pelo Pix - ${nome} - ${doc} - ${banco}`;

const dois = (n: number) => String(n).padStart(2, "0");

export function gerarDemo(fim = "2026-10-27", semente = 2026): Lancamento[] {
  const r = sorteador(semente);
  const lista: Lancamento[] = [];
  const add = (data: string, hora: string | null, valor: number, descricao: string) =>
    lista.push({ data, hora, valor: Math.round(valor * 100) / 100, descricao, origem: "conta", banco: "nubank" });

  const fimData = new Date(`${fim}T12:00:00Z`);
  const inicio = new Date(fimData);
  inicio.setUTCFullYear(inicio.getUTCFullYear() - 1);
  inicio.setUTCDate(inicio.getUTCDate() + 1);

  const hora = (de: number, ate: number) => `${dois(r.inteiro(de, ate))}:${dois(r.inteiro(0, 59))}`;

  for (let t = inicio.getTime(); t <= fimData.getTime(); t += 86_400_000) {
    const d = new Date(t);
    const data = d.toISOString().slice(0, 10);
    const dia = d.getUTCDate();
    const semana = d.getUTCDay();
    const fds = semana === 0 || semana === 6;
    const dezembro = d.getUTCMonth() === 11;

    // Salário, aluguel e contas fixas
    if (dia === 5) add(data, "08:02", 6850, "Transferência recebida - ACME SOFTWARE LTDA - 12.345.678/0001-90 - Salário");
    if (dia === 10) add(data, "09:15", -1650, pix(true, "IMOBILIARIA HORIZONTE LTDA", "98.765.432/0001-10", BANCOS[1]));
    if (dia === 12) add(data, "10:20", -r.entre(140, 230), pix(true, "CPFL PAULISTA", "33.050.196/0001-88", BANCOS[2]));
    if (dia === 18) add(data, "07:40", -119.9, "Compra no débito - CLARO S.A.");
    if (dia === 15) add(data, "11:00", -1200, "Aplicação RDB");

    // Assinaturas (as últimas são as "esquecidas")
    if (dia === 3) add(data, "08:12", -44.9, "Compra no débito - NETFLIX.COM");
    if (dia === 7) add(data, "09:30", -23.9, "Compra no débito - SPOTIFY");
    if (dia === 21) add(data, "07:01", -19.9, "Compra no débito - AMAZON PRIME CANAIS");
    if (dia === 9) add(data, "06:00", -129.9, "Compra no débito - SMARTFIT MENSALIDADE");
    if (dia === 26) add(data, "10:44", -9.9, "Compra no débito - APPLE.COM/BILL ICLOUD");
    if (dia === 14) add(data, "06:10", -14.9, "Compra no débito - DUOLINGO PLUS");

    // Delivery: mais no fim de semana e de noite
    const pedidos = fds ? r.inteiro(0, 2) : r.chance(0.35) ? 1 : 0;
    for (let i = 0; i < pedidos; i++) {
      const lugar = r.um(["IFOOD *PIZZARIA BELLA", "IFOOD *SUSHI DA VILA", "IFOOD *BURGER DO ZE", "RAPPI*RAPPI BRASIL", "ZE DELIVERY"]);
      const h = r.chance(0.12) ? hora(0, 3) : hora(19, 23);
      add(data, h, -r.entre(28, 96), `Compra no débito - ${lugar}`);
    }

    // Transporte por app
    if (r.chance(fds ? 0.5 : 0.3)) {
      const app = r.chance(0.65) ? "UBER *TRIP" : "99APP *99POP";
      const h = r.chance(0.15) ? hora(0, 4) : hora(7, 23);
      add(data, h, -r.entre(9, 42), `Compra no débito - ${app}`);
    }

    // Mercado, café e rolê
    if (semana === 6 || r.chance(0.12)) add(data, hora(9, 20), -r.entre(60, 340), r.um(["Compra no débito - SUPERMERCADO SAVEGNAGO", "Compra no débito - ASSAI ATACADISTA", "Compra no débito - HORTIFRUTI DA PRAÇA"]));
    if (!fds && r.chance(0.55)) add(data, hora(8, 16), -r.entre(5, 14), r.um(["Compra no débito - CAFE DO PONTO", "Compra no débito - PADARIA SAO BENTO"]));
    if ((semana === 5 || semana === 6) && r.chance(0.6)) add(data, hora(20, 23), -r.entre(60, 220), r.um(["Compra no débito - BAR DO ARMANDO", "Compra no débito - CERVEJARIA LUPULO", "Compra no débito - RESTAURANTE SABOR CASEIRO"]));
    if (r.chance(0.04)) add(data, hora(10, 21), -r.entre(18, 90), "Compra no débito - DROGARIA POPULAR");
    if (r.chance(0.05)) add(data, hora(9, 22), -r.entre(40, 420), r.um(["Compra no débito - MERCADOLIVRE*LOJA", "Compra no débito - SHOPEE BRASIL", "Compra no débito - AMAZON MARKETPLACE"]));
    if (dezembro && dia >= 15 && dia <= 23 && r.chance(0.5)) add(data, hora(10, 21), -r.entre(80, 380), "Compra no débito - MERCADOLIVRE*PRESENTES");

    // Pix entre amigos: racha de conta, presente, devolução
    if (r.chance(0.22)) {
      const [nome, doc] = AMIGOS[Math.min(AMIGOS.length - 1, Math.floor(r.numero() ** 1.8 * AMIGOS.length))];
      const enviado = r.chance(0.62);
      const h = r.chance(0.08) ? hora(0, 3) : hora(8, 23);
      add(data, h, (enviado ? -1 : 1) * r.entre(12, 180), pix(enviado, nome, doc, r.um(BANCOS)));
    }
  }

  // Um dia memorável: a viagem
  const viagem = new Date(fimData);
  viagem.setUTCMonth(viagem.getUTCMonth() - 4);
  const dv = viagem.toISOString().slice(0, 10);
  add(dv, "13:20", -1890, "Compra no débito - LATAM AIRLINES");
  add(dv, "14:05", -620, pix(true, "POUSADA MAR AZUL LTDA", "11.222.333/0001-44", BANCOS[0]));
  add(dv, "21:40", -184.5, "Compra no débito - RESTAURANTE FRUTOS DO MAR");

  return lista.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
}

/** Escreve lançamentos como um OFX no formato do Nubank (para baixar e testar). */
export function paraOfx(lancamentos: Lancamento[]): string {
  const data = (l: Lancamento) => `${l.data.replace(/-/g, "")}${(l.hora ?? "00:00").replace(":", "")}00[-3:BRT]`;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inicio = lancamentos[0]?.data.replace(/-/g, "") ?? "";
  const fim = lancamentos[lancamentos.length - 1]?.data.replace(/-/g, "") ?? "";
  const itens = lancamentos
    .map(
      (l, i) => `<STMTTRN>
<TRNTYPE>${l.valor < 0 ? "DEBIT" : "CREDIT"}</TRNTYPE>
<DTPOSTED>${data(l)}</DTPOSTED>
<TRNAMT>${l.valor.toFixed(2)}</TRNAMT>
<FITID>demo-${String(i).padStart(5, "0")}</FITID>
<MEMO>${esc(l.descricao)}</MEMO>
</STMTTRN>`,
    )
    .join("\n");
  return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:UTF-8
CHARSET:NONE
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0</CODE>
<SEVERITY>INFO</SEVERITY>
</STATUS>
<LANGUAGE>POR</LANGUAGE>
<FI>
<ORG>NU PAGAMENTOS S.A.</ORG>
<FID>260</FID>
</FI>
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1</TRNUID>
<STMTRS>
<CURDEF>BRL</CURDEF>
<BANKACCTFROM>
<BANKID>0260</BANKID>
<BRANCHID>1</BRANCHID>
<ACCTID>00000000-0</ACCTID>
<ACCTTYPE>CHECKING</ACCTTYPE>
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${inicio}000000[-3:BRT]</DTSTART>
<DTEND>${fim}000000[-3:BRT]</DTEND>
${itens}
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;
}
