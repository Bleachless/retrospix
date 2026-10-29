import type { Lancamento } from "../types";
import { nomeProprio, normalizar } from "../parse/texto";

export type Categoria =
  | "delivery"
  | "transporte"
  | "assinatura"
  | "mercado"
  | "restaurante"
  | "farmacia"
  | "contas"
  | "combustivel"
  | "compras"
  | "transferencia"
  | "salario"
  | "fatura"
  | "investimento"
  | "outros";

export const NOME_CATEGORIA: Record<Categoria, string> = {
  delivery: "Delivery",
  transporte: "Transporte por app",
  assinatura: "Assinaturas",
  mercado: "Mercado",
  restaurante: "Bares e restaurantes",
  farmacia: "Farmácia",
  contas: "Contas da casa",
  combustivel: "Combustível",
  compras: "Compras online",
  transferencia: "Transferências",
  salario: "Salário",
  fatura: "Fatura do cartão",
  investimento: "Investimentos",
  outros: "Outros",
};

export type Classificado = Lancamento & {
  categoria: Categoria;
  pix: boolean;
  /** Nome de quem mandou ou recebeu, em Pix e transferências. */
  contraparte: string | null;
  contraparteTipo: "pessoa" | "empresa" | null;
  /** Nome curto do estabelecimento, já arrumado para mostrar. */
  nome: string;
  /** Chave para agrupar lançamentos do mesmo lugar ou da mesma pessoa. */
  chave: string;
};

/**
 * Marcas conhecidas: nome bonito e categoria. A ordem importa, porque
 * "uber eats" é delivery e "uber" é transporte, "amazon prime" é assinatura
 * e "amazon" é compra.
 */
const MARCAS: [RegExp, string, Categoria][] = [
  [/\bifood\b|\bifd\s?\*|^ifd\b/, "iFood", "delivery"],
  [/uber\s?\*?\s?eats/, "Uber Eats", "delivery"],
  [/\brappi\b/, "Rappi", "delivery"],
  [/\bze delivery\b|\bze entregas?\b|ze\.delivery/, "Zé Delivery", "delivery"],
  [/aiqfome/, "Aiqfome", "delivery"],
  [/james delivery/, "James Delivery", "delivery"],
  [/99 ?food/, "99Food", "delivery"],
  [/\bkeeta\b/, "Keeta", "delivery"],
  [/anota ?ai/, "Anota AI", "delivery"],
  [/\bdelivery\b/, "", "delivery"],

  [/\buber\b|\buber\s?\*|ubr\*/, "Uber", "transporte"],
  [/\b99 ?(app|pop|taxi|tecnologia|tecnolog|ride|corrida|moto)\b|^99\s?\*/, "99", "transporte"],
  [/cabify/, "Cabify", "transporte"],
  [/indrive|in driver/, "inDrive", "transporte"],

  [/netflix/, "Netflix", "assinatura"],
  [/spotify/, "Spotify", "assinatura"],
  [/amazon ?prime|prime ?video|amazonprime|primevideo/, "Amazon Prime", "assinatura"],
  [/disney/, "Disney+", "assinatura"],
  [/\bhbo\b|hbomax|\bmax\.com|\bmax \*/, "Max", "assinatura"],
  [/globoplay/, "Globoplay", "assinatura"],
  [/youtube|google \*youtube/, "YouTube Premium", "assinatura"],
  [/google ?one|google storage/, "Google One", "assinatura"],
  [/icloud|apple\.com|apple com bill|apple services/, "Apple", "assinatura"],
  [/deezer/, "Deezer", "assinatura"],
  [/paramount/, "Paramount+", "assinatura"],
  [/crunchyroll/, "Crunchyroll", "assinatura"],
  [/chatgpt|openai/, "ChatGPT", "assinatura"],
  [/claude\.ai|anthropic/, "Claude", "assinatura"],
  [/microsoft|xbox|office 365/, "Microsoft", "assinatura"],
  [/playstation|\bpsn\b|sony interactive/, "PlayStation", "assinatura"],
  [/nintendo/, "Nintendo", "assinatura"],
  [/adobe/, "Adobe", "assinatura"],
  [/\bcanva\b/, "Canva", "assinatura"],
  [/smart ?fit/, "Smart Fit", "assinatura"],
  [/bluefit/, "Bluefit", "assinatura"],
  [/totalpass/, "TotalPass", "assinatura"],
  [/wellhub|gympass/, "Wellhub", "assinatura"],
  [/duolingo/, "Duolingo", "assinatura"],
  [/tinder/, "Tinder", "assinatura"],
  [/kindle unlimited|audible/, "Amazon Kindle", "assinatura"],
  [/\bmubi\b/, "Mubi", "assinatura"],
  [/\bdazn\b/, "DAZN", "assinatura"],
  [/telecine/, "Telecine", "assinatura"],
  [/assinatura|mensalidade/, "", "assinatura"],

  [/mercado ?livre|mercadolivre|\bmeli\b/, "Mercado Livre", "compras"],
  [/amazon|amzn/, "Amazon", "compras"],
  [/shopee/, "Shopee", "compras"],
  [/shein/, "Shein", "compras"],
  [/aliexpress/, "AliExpress", "compras"],
  [/\btemu\b/, "Temu", "compras"],
  [/magalu|magazine luiza/, "Magalu", "compras"],
  [/americanas/, "Americanas", "compras"],
  [/kabum/, "KaBuM!", "compras"],

  [/drogasil|droga ?raia|drogaria|pague menos|panvel|farmacia|\bfarma\b|drogao/, "", "farmacia"],

  [/savegnago/, "Savegnago", "mercado"],
  [/carrefour/, "Carrefour", "mercado"],
  [/assai/, "Assaí", "mercado"],
  [/atacadao/, "Atacadão", "mercado"],
  [/pao de acucar/, "Pão de Açúcar", "mercado"],
  [/supermerc|\bmercado\b(?! ?pago)|\bmercearia|atacad|hortifruti|sacolao|hipermerc|\bsams club|\bmakro\b|st marche|oba hortifruti|\bdia\b (brasil|supermercado)/, "", "mercado"],

  [/auto ?posto|\bposto\b|combustiv|\bshell\b|ipiranga|petrobras|br mania|raizen/, "", "combustivel"],

  [/\bcpfl\b|\benel\b|\bcemig\b|\bcopel\b|celesc|\blight\b|energisa|neoenergia|equatorial/, "", "contas"],
  [/sabesp|copasa|sanepar|cedae|\bdaae\b|\bsaae\b|agua e esgoto|saneamento/, "", "contas"],
  [/\bclaro\b|\bvivo\b|telefonica|\btim\b|\boi s|net servicos|\bsky\b|algar|desktop/, "", "contas"],
  [/condominio|aluguel|\biptu\b|\bipva\b|detran|comgas|ultragaz|liquigas|seguro/, "", "contas"],

  [/mc ?donald|burger king|\bbk\b|subway|outback|giraffas|spoleto|madero|coco bambu|habib|starbucks|bacio di latte|cacau show|kopenhagen/, "", "restaurante"],
  [/restaurante|lanchonete|pizza|burg(u)?er|hamburg|espetaria|churrasc|\bbar\b|boteco|cervejaria|chopp|padaria|panificadora|\bcafe\b|coffee|sorvete|gelato|\bacai\b|doceria|confeitaria|sushi|temaki|esfiha|petisc|cantina|bistro|pastel|food truck|\bbar ?do/, "", "restaurante"],
];

const INVESTIMENTO = /aplicacao|resgate|\brdb\b|\bcdb\b|\blci\b|\blca\b|caixinha|tesouro direto|poupanca|dinheiro guardado|guardado|investimento|cofrinho|porquinho|rendimento/;
const FATURA = /pagamento (de )?fatura|pagto fatura|pag fatura|fatura (do )?cartao|pagamento recebido|pgto fatura/;
const SALARIO = /salario|folha de pagamento|\bfolha\b|remuneracao|proventos|pagamento de salario/;
const PIX = /\bpix\b/;
const TRANSFERENCIA = /\bted\b|\bdoc\b|transferencia|\btransf\b|\btev\b/;
const EMPRESA = /\b(ltda|s\.?a\.?|s\/a|me|eireli|epp|mei|pagamentos|comercio|servicos|tecnologia|instituicao|banco|bco|telecom|energia|distribuidora|cia|companhia)\b/;
const CNPJ = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;
const PALAVRA_DE_DIRECAO =
  /^(pix|transfer[eê]ncia|transf|ted|doc|tev|enviad[oa]|recebid[oa]|qrs?|qr ?code|pagamento|devolvid[oa]|agendad[oa]|emitid[oa]|pelo|via|para|por|p\/|remetente|destinat[aá]rio|rem|dest?)(?![a-zà-ú])\s*[:–-]?\s*/i;
const CPF_MASCARADO =/[•*x]{3}\.\d{3}\.\d{3}-[•*x]{2}|\d{3}\.\d{3}\.\d{3}-\d{2}/i;

/** Tira o "Pix enviado", documentos, bancos e datas e sobra o nome da pessoa. */
export function extrairContraparte(descricao: string): { nome: string; tipo: "pessoa" | "empresa" } | null {
  const original = descricao.trim();
  const empresaPorDoc = CNPJ.test(original);
  const pessoaPorDoc = CPF_MASCARADO.test(original);

  // Nubank: "Transferência enviada pelo Pix - NOME - DOC - BANCO Agência..."
  const partes = original.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  let candidato: string | null = null;
  const SO_DIRECAO = /^(pix|ted|doc|enviad[oa]|recebid[oa]|transf\w*|qr ?code|qrs?|pagamento|devolvid[oa]|agendad[oa])$/;
  if (partes.length >= 2 && /pix|transfer|ted|doc/i.test(normalizar(partes[0]))) {
    // BB: "Pix - Enviado - 07/04 02:13 Fulano"; Nubank: "... pelo Pix - FULANO - doc"
    candidato = partes.slice(1).find((p) => !SO_DIRECAO.test(normalizar(p))) ?? null;
  } else {
    // "Transferência Pix enviada Fulano", "PIX TRANSF FULANO": tira as
    // palavras de direção do começo, uma de cada vez.
    let s = original;
    for (let antes = ""; antes !== s; ) {
      antes = s;
      s = s.replace(PALAVRA_DE_DIRECAO, "");
    }
    candidato = s.split(/\s+-\s+/)[0];
  }
  if (!candidato) return null;
  let nome = candidato
    .replace(/^cp\s*:\s*\d+\s*-?\s*/i, "")
    .replace(CNPJ, "")
    .replace(CPF_MASCARADO, "")
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, "")
    .replace(/\b\d{2}:\d{2}\b/g, "")
    .replace(/["“”]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Itaú corta o nome e cola a data: "PIX TRANSF JOAO SI12/10"
  nome = nome.replace(/\d+$/, "").trim();
  if (nome.length < 2 || /^\d+$/.test(nome)) return null;
  const tipo = empresaPorDoc
    ? "empresa"
    : pessoaPorDoc
      ? "pessoa"
      : EMPRESA.test(normalizar(nome))
        ? "empresa"
        : "pessoa";
  return { nome: nomeProprio(nome), tipo };
}

/** Tira os prefixos que os bancos põem antes do estabelecimento. */
function limparEstabelecimento(descricao: string): string {
  let s = descricao
    .replace(/^(compra( no| com)? (debito|débito|credito|crédito)( - |: |\s)?)/i, "")
    .replace(/^(pagamento de boleto efetuado|pagamento de boleto|pagto boleto|pag boleto)( - |: |\s)?/i, "")
    .replace(/^(compra com cartao|compra cartao|cartao)( - |: |\s)?/i, "")
    .replace(/^(debito automatico|deb aut|debito aut\.?)( - |: |\s)?/i, "");
  s = s.split(/\s+-\s+/)[0];
  s = s
    .replace(/\*/g, " ")
    .replace(/[-_]?lj\d+/gi, "")
    .replace(/\b\d{2}\/\d{2}\b/g, "")
    .replace(/\s+(s\.?\/?a\.?|ltda\.?|me|eireli|epp)$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return s || descricao;
}

function chaveDe(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");
}

export function classificar(l: Lancamento): Classificado {
  const n = normalizar(l.descricao);
  const pix = PIX.test(n);
  const transf = pix || TRANSFERENCIA.test(n);
  const contra = transf ? extrairContraparte(l.descricao) : null;

  let categoria: Categoria = "outros";
  let marca = "";

  if (FATURA.test(n)) categoria = "fatura";
  else if (INVESTIMENTO.test(n) && !/pix/.test(n)) categoria = "investimento";
  else {
    // Pix para empresa conta pela marca (Pix para a Claro é conta da casa).
    const alvo = contra && contra.tipo === "pessoa" ? null : normalizar(contra?.nome ?? "") + " " + n;
    if (alvo) {
      for (const [re, nome, cat] of MARCAS) {
        if (re.test(alvo)) {
          categoria = cat;
          marca = nome;
          break;
        }
      }
    }
    if (categoria === "outros") {
      if (l.valor > 0 && SALARIO.test(n)) categoria = "salario";
      else if (transf) categoria = "transferencia";
    }
  }

  const nome =
    marca ||
    (categoria === "fatura" ? "Fatura do cartão" : "") ||
    (contra ? contra.nome : nomeProprio(limparEstabelecimento(l.descricao)).replace(/\s+/g, " "));
  return {
    ...l,
    categoria,
    pix,
    contraparte: contra?.nome ?? null,
    contraparteTipo: contra?.tipo ?? null,
    nome,
    chave: marca ? normalizar(marca) : contra ? `@${normalizar(contra.nome)}` : chaveDe(limparEstabelecimento(l.descricao)),
  };
}
