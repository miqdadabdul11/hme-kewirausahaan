
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import { WelcomeSplash } from "@/components/layout/WelcomeSplash";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "E-STORE HME FPTI UPI",
  description: "E-STORE HME FPTI UPI - platform pemesanan produk dan merchandise.",
  openGraph: {
    title: "E-STORE HME FPTI UPI",
    description: "Pesan merchandise HME FPTI UPI.",
    images: ["/logo-estore-transparent.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-estore-transparent.png", sizes: "819x1024", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0F0C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <Script id="estore-welcome-splash-bootstrap" strategy="beforeInteractive">
          {`(() => {
            if (window.location.pathname.startsWith("/admin")) return;
            try {
              if (
                window.sessionStorage.getItem("estore-welcome-splash-seen") === "true" ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ) {
                document.documentElement.setAttribute("data-welcome-splash-skip", "true");
              }
            } catch {
              if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                document.documentElement.setAttribute("data-welcome-splash-skip", "true");
              }
            }
          })();`}
        </Script>
        <WelcomeSplash />
        {children}
      </body>
    </html>
  );
}
