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
  metadataBase: new URL("https://marstube.vercel.app"),
  title: {
    default: "MarsTube - Ad-Free YouTube",
    template: "%s | MarsTube"
  },
  description: "Prémiový zážitok zo sledovania videí a počúvania hudby bez reklám a bez prerušení. Váš osobný hudobný a video prehrávač.",
  keywords: ["youtube", "bez reklám", "hudba", "videá", "prehrávač", "marstube", "marso", "streaming", "slovensko", "zadarmo", "bez prerušení"],
  authors: [{ name: "Marsoftmedia", url: "https://marso.sk" }],
  creator: "Marsoftmedia",
  publisher: "Marso",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MarsTube",
  },
  openGraph: {
    title: "MarsTube - Prémiový Ad-Free YouTube",
    description: "Zážitok zo sledovania videí a hudby bez otravných reklám a prerušení. Tvoj nový obľúbený prehrávač.",
    url: "https://marstube.vercel.app",
    siteName: "MarsTube",
    images: [
      {
        url: "https://marstube.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "MarsTube Promotional Image",
      },
    ],
    locale: "sk_SK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MarsTube - Ad-Free YouTube",
    description: "Sleduj videá a počúvaj hudbu bez reklám.",
    images: ["https://marstube.vercel.app/og-image.png"],
  },
  other: {
    "geo.region": "SK",
    "geo.placename": "Slovakia",
    "geo.position": "48.669;19.699",
    "ICBM": "48.669, 19.699",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="sk" className={`${jetbrainsMono.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "MarsTube",
              "operatingSystem": "Web",
              "applicationCategory": "MultimediaApplication",
              "description": "Prémiový zážitok zo sledovania videí a hudby bez reklám a prerušení.",
              "url": "https://marso.sk",
              "publisher": {
                "@type": "Organization",
                "name": "Marsoftmedia",
                "url": "https://marso.sk"
              }
            })
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark">
          <ServiceWorkerRegister />
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div style={{ flex: '1' }}>
              {children}
            </div>
            <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-glass-solid)' }}>
              <a href="https://marso.sk/portfolio/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.target.style.color = 'inherit'}>
                &copy; 2026 Peter Maršo. Všetky práva vyhradené.
              </a>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
