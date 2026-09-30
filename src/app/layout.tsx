
import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "HME Kewirausahaan",
  description: "Platform pemesanan merchandise dan produk HME Kewirausahaan.",
  openGraph: {
    title: "HME Kewirausahaan",
    description: "Pesan merchandise teknik elektro HME Kewirausahaan.",
    images: ["/logo-hme.png"],
  },
  icons: { icon: "/logo-hme.png" },
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
