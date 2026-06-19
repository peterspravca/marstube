import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#7B2CBF",
};

export const metadata = {
  title: "MarsTube - Ad-Free YouTube",
  description: "A premium, ad-free YouTube experience.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" }
    ],
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MarsTube",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="sk" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
