import { JetBrains_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ThemeProvider from "@/components/ThemeProvider";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#7B2CBF",
};

export const metadata = {
  title: "MarsTube - Ad-Free YouTube",
  description: "A premium, ad-free YouTube experience.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MarsTube",
  },
  openGraph: {
    title: "MarsTube - Ad-Free YouTube",
    description: "A premium, ad-free YouTube experience. Music and video streaming without interruptions.",
    url: "https://marso.sk",
    siteName: "MarsTube",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MarsTube Promotional Image",
      },
    ],
    locale: "sk_SK",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="sk" className={`${jetbrainsMono.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark">
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
