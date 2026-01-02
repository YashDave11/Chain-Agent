import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ChainAgent | Automated DCA with MetaMask Advanced Permissions",
  description: "AI-powered DCA automation. Grant one permission, let agents buy ETH for you automatically when prices dip.",
  keywords: ["DCA", "MetaMask", "ERC-7715", "Advanced Permissions", "Ethereum", "DeFi", "Automation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
