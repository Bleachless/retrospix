import type { BancoId } from "./types";

export type InfoBanco = {
  id: BancoId;
  nome: string;
  cor: string;
  formatos: string[];
  /** Como exportar, em passos curtos. Os menus mudam, então é um guia. */
  passos: string;
};

export const BANCOS: InfoBanco[] = [
  {
    id: "nubank",
    nome: "Nubank",
    cor: "#820ad1",
    formatos: ["OFX", "CSV", "fatura CSV"],
    passos: "No app, abra a conta, toque em Extrato e no ícone de exportar. Escolha o período e o Nubank manda PDF, OFX e CSV por e-mail. A fatura do cartão sai em CSV no app.nubank.com.br.",
  },
  {
    id: "inter",
    nome: "Inter",
    cor: "#ff7a00",
    formatos: ["OFX", "CSV"],
    passos: "No app, vá em Extrato, toque em Exportar, escolha o período e o formato OFX ou CSV.",
  },
  {
    id: "itau",
    nome: "Itaú",
    cor: "#ec7000",
    formatos: ["OFX"],
    passos: "No internet banking, abra o Extrato da conta, escolha o período e salve em OFX (Money).",
  },
  {
    id: "c6",
    nome: "C6 Bank",
    cor: "#2b2b2b",
    formatos: ["OFX", "CSV", "fatura CSV"],
    passos: "No app, abra o Extrato, toque em exportar e escolha OFX ou CSV. A fatura do cartão também exporta em CSV.",
  },
  {
    id: "bradesco",
    nome: "Bradesco",
    cor: "#cc092f",
    formatos: ["OFX", "CSV"],
    passos: "No internet banking, abra Extrato, escolha o período e use Salvar como OFX.",
  },
  {
    id: "bb",
    nome: "Banco do Brasil",
    cor: "#f8d117",
    formatos: ["OFX", "CSV"],
    passos: "No site do BB, abra Extrato, escolha o mês e toque em Salvar, no formato OFX ou CSV. O BB ainda manda o horário de cada Pix.",
  },
  {
    id: "santander",
    nome: "Santander",
    cor: "#ec0000",
    formatos: ["OFX"],
    passos: "No internet banking, vá em Conta corrente, Extrato, escolha o período e exporte em OFX.",
  },
  {
    id: "mercadopago",
    nome: "Mercado Pago",
    cor: "#00b1ea",
    formatos: ["CSV", "OFX"],
    passos: "No site, abra Seu dinheiro, Relatórios ou Extrato da conta, escolha o período e baixe em CSV.",
  },
  {
    id: "picpay",
    nome: "PicPay",
    cor: "#21c25e",
    formatos: ["em breve"],
    passos: "O PicPay hoje exporta o extrato só em PDF. Ele entra aqui quando o leitor de PDF ficar pronto.",
  },
];

export const NOME_BANCO: Record<BancoId, string> = {
  nubank: "Nubank",
  inter: "Inter",
  itau: "Itaú",
  c6: "C6 Bank",
  bradesco: "Bradesco",
  bb: "Banco do Brasil",
  santander: "Santander",
  mercadopago: "Mercado Pago",
  picpay: "PicPay",
  caixa: "Caixa",
  outro: "Banco não identificado",
};
