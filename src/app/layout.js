import { Montserrat } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ThemeProvider from "@/components/ThemeProvider";

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
};

export default function RootLayout({ children }) {
  return (
    <html lang="sk" className={`${montserrat.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark">
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
