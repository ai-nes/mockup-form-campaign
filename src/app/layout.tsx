import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import "./css/default.css";
import "./css/dark.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "CRM Dashboard",
  description: "Modern CRM Mockups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-[#F8FAFC] text-[#0F172A]`}>
        <div className="flex min-h-screen w-full items-center justify-center">
          <main className="w-full h-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

