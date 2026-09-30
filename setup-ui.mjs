import fs from 'fs';
import path from 'path';

const uiDir = path.join(process.cwd(), 'src/components/ui');
if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

const globalsCss = `
:root {
  --green-500: #6CC24A;
  --green-400: #8EDB6B;
  --green-100: #EAF8E2;
  --black-900: #0B0F0C;
  --black-700: #1C231E;
  --white: #FFFFFF;
  --gray-100: #F4F6F4;
  --gray-500: #6B756E;
  --orange-500: #F47B20;

  --bg: var(--gray-100);
  --text: var(--black-900);
  --primary: var(--green-500);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-inter), sans-serif;
}

h1, h2, h3, h4, h5, h6, .heading {
  font-family: var(--font-space), sans-serif;
  font-weight: 700;
}

a { text-decoration: none; color: inherit; }

.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 72px;
}
`;

fs.writeFileSync(path.join(process.cwd(), 'src/app/globals.css'), globalsCss);

const layoutTsx = `
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
      <body className={\`\${inter.variable} \${spaceGrotesk.variable}\`}>
        {children}
      </body>
    </html>
  );
}
`;

fs.writeFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), layoutTsx);

console.log('UI Foundation created');
