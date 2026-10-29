import { describe, expect, it } from "vitest";
import { lerExtrato, lerExtratoTexto } from ".";
import { lerOfx } from "./ofx";

// Todos os extratos daqui são inventados.

const cabecalho = (org: string, fid: string, charset = "NONE") => `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:${charset === "1252" ? "USASCII" : "UTF-8"}
CHARSET:${charset}
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
<OFX>
<SIGNONMSGSRSV1><SONRS><STATUS><CODE>0<SEVERITY>INFO</STATUS>
<FI><ORG>${org}<FID>${fid}</FI></SONRS></SIGNONMSGSRSV1>`;

const NUBANK = `${cabecalho("NU PAGAMENTOS S.A.", "260")}
<BANKMSGSRSV1><STMTTRNRS><STMTRS><CURDEF>BRL
<BANKACCTFROM><BANKID>0260<ACCTID>00000-0<ACCTTYPE>CHECKING</BANKACCTFROM>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>CREDIT</TRNTYPE>
<DTPOSTED>20260105000000[-3:BRT]</DTPOSTED>
<TRNAMT>350.00</TRNAMT>
<FITID>aaa-1</FITID>
<MEMO>Transferência recebida pelo Pix - FULANA DE TESTE - •••.111.222-•• - BANCO FICTICIO (0999) Agência: 1 Conta: 123-4</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20260106000000[-3:BRT]</DTPOSTED>
<TRNAMT>-42.90</TRNAMT>
<FITID>aaa-2</FITID>
<MEMO>Compra no débito - IFOOD *LANCHE &amp; CIA</MEMO>
</STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

describe("OFX", () => {
  it("lê o OFX do Nubank (SGML, UTF-8, sem hora)", () => {
    const e = lerOfx(NUBANK);
    expect(e.banco).toBe("nubank");
    expect(e.formato).toBe("ofx");
    expect(e.lancamentos).toHaveLength(2);
    expect(e.lancamentos[0]).toMatchObject({ data: "2026-01-05", hora: null, valor: 350, id: "aaa-1", origem: "conta" });
    expect(e.lancamentos[1].descricao).toBe("Compra no débito - IFOOD *LANCHE & CIA");
  });

  it("lê o OFX do Inter em Windows-1252 e sem lançamentos", () => {
    const texto = `${cabecalho("Banco Intermedium S/A", "077", "1252")}
<BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKACCTFROM><BANKID>077<ACCTID>1</BANKACCTFROM>
<BANKTRANLIST><DTSTART>20260101<DTEND>20260131
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260110<TRNAMT>-19.90<FITID>x1<MEMO>PIX ENVIADO - Padaria Pão Quente</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
    // codifica em 1252 à mão: "ã" vira 0xE3
    const bytes = Uint8Array.from([...texto].map((c) => (c === "ã" ? 0xe3 : c.charCodeAt(0))));
    const e = lerExtrato("Extrato-01-01-2026-a-31-01-2026-OFX.ofx", bytes);
    expect(e.banco).toBe("inter");
    expect(e.lancamentos[0]).toMatchObject({ data: "2026-01-10", valor: -19.9, descricao: "PIX ENVIADO - Padaria Pão Quente" });

    const vazio = lerOfx(`${cabecalho("Banco Intermedium S/A", "077")}<BANKTRANLIST><DTSTART>20260101</BANKTRANLIST></OFX>`);
    expect(vazio.lancamentos).toEqual([]);
  });

  it("junta NAME e MEMO, como no Itaú, e acha o banco pelo código", () => {
    const texto = `${cabecalho("ITAU", "341")}
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260302120000<TRNAMT>-25.00<NAME>PIX TRANSF CICLANO12/03<MEMO>PIX TRANSF CICLANO12/03</STMTTRN></OFX>`;
    const e = lerOfx(texto);
    expect(e.banco).toBe("itau");
    expect(e.lancamentos[0]).toMatchObject({ hora: "12:00", descricao: "PIX TRANSF CICLANO12/03" });
  });

  it("pega a hora que o Banco do Brasil escreve no histórico", () => {
    const texto = `${cabecalho("Banco do Brasil", "001")}
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260407<TRNAMT>-80.00<NAME>Pix - Enviado<MEMO>07/04 02:13 Beltrano Teste</STMTTRN></OFX>`;
    const e = lerOfx(texto);
    expect(e.banco).toBe("bb");
    expect(e.lancamentos[0]).toMatchObject({ hora: "02:13", descricao: "Pix - Enviado - 07/04 02:13 Beltrano Teste" });
  });

  it("põe sinal quando o banco manda o valor sempre positivo", () => {
    const texto = `${cabecalho("Banco Exemplo", "999")}
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260101<TRNAMT>10.00<MEMO>Tarifa</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260101<TRNAMT>5.00<MEMO>Estorno</STMTTRN></OFX>`;
    expect(lerOfx(texto).lancamentos.map((l) => l.valor)).toEqual([-10, 5]);
  });

  it("lê fatura de cartão em OFX 2 (XML)", () => {
    const texto = `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="220"?>
<OFX><SIGNONMSGSRSV1><SONRS><FI><ORG>Banco C6 S.A.</ORG><FID>336</FID></FI></SONRS></SIGNONMSGSRSV1>
<CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20260210</DTPOSTED><TRNAMT>-55.00</TRNAMT><MEMO>UBER *TRIP</MEMO></STMTTRN>
<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20260215</DTPOSTED><TRNAMT>300.00</TRNAMT><MEMO>Pagamento recebido</MEMO></STMTTRN>
</BANKTRANLIST></CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1></OFX>`;
    const e = lerExtratoTexto("fatura.ofx", texto);
    expect(e.banco).toBe("c6");
    expect(e.leitor).toBe("OFX de cartão");
    expect(e.lancamentos.map((l) => [l.origem, l.valor])).toEqual([
      ["cartao", -55],
      ["cartao", 300],
    ]);
  });

  it("recusa o que não é OFX", () => {
    expect(() => lerOfx("oi")).toThrow(/OFX/);
  });
});
