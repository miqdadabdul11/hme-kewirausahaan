
import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "Sub Kewirausahaan HME FPTI UPI",
  description: "Platform pemesanan produk dan merchandise HME FPTI UPI.",
  openGraph: {
    title: "Sub Kewirausahaan HME FPTI UPI",
    description: "Pesan merchandise HME FPTI UPI.",
    images: ["/logo-hme-mark.png"],
  },
  icons: { icon: "/logo-hme-mark.png" },
};

export const viewport: Viewport = {
  themeColor: "#0B0F0C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}
