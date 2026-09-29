import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HME Kewirausahaan",
  description: "Platform penjualan dan pengelolaan pesanan HME Kewirausahaan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
