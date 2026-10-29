import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://retrospix.joaovaz.dev"),
  title: "Retrospix · seu ano em Pix",
  description:
    "Suba o extrato do banco e ganhe a retrospectiva do seu dinheiro em stories: Pix, mês mais caro, delivery, assinaturas esquecidas. O extrato não sai do seu aparelho.",
  openGraph: {
    title: "Retrospix · seu ano em Pix",
    description: "A retrospectiva do seu dinheiro em stories. Lida no seu aparelho, sem enviar nada.",
    url: "https://retrospix.joaovaz.dev",
    siteName: "Retrospix",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#100c1f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${jetbrains.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
