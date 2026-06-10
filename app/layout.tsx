import Script from 'next/script';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo, Tajawal } from "next/font/google";
import "./globals.css";

// الخطوط الإنجليزية الافتراضية
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// الخطوط العربية الاحترافية
const cairo = Cairo({ 
  subsets: ["latin", "arabic"], 
  variable: '--font-cairo' 
});

const tajawal = Tajawal({ 
  weight: ['400', '500', '700', '900'], 
  subsets: ["arabic"], 
  variable: '--font-tajawal' 
});

// إعدادات الـ SEO لمحركات البحث (جوجل)
export const metadata: Metadata = {
  title: "GRUPPO DI RAWDA | Impresa Edile e Ristrutturazioni in Italia",
  description: "Leader in Italia per ristrutturazioni, costruzioni e interior design. GRUPPO DI RAWDA offre soluzioni complete chiavi in mano. رواد المقاولات والتشطيبات والتصميم الداخلي في إيطاليا.",
  keywords: "impresa edile italia, ristrutturazioni, interior design, costruzioni, مقاولات في ايطاليا, تشطيبات, تصميم داخلي, GRUPPO DI RAWDA, renovation italy",
  authors: [{ name: "TalosWhale - Dev Mahmoud Hashish" }],
  openGraph: {
    title: "GRUPPO DI RAWDA | Impresa Edile e Ristrutturazioni in Italia",
    description: "Leader in Italia per ristrutturazioni, costruzioni e interior design. GRUPPO DI RAWDA offre soluzioni complete chiavi in mano.",
    url: "https://gruppodirawda.it", // الدومين بتاعك
    siteName: "GRUPPO DI RAWDA",
    images: [
      {
        url: "/logo-construction.png", // الصورة اللي هتظهر لما حد يعمل شير للينك
        width: 800,
        height: 600,
      },
    ],
    locale: "it_IT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        
        {/* Google Tag (gtag.js) */}
        <Script 
          strategy="afterInteractive" 
          src="https://www.googletagmanager.com/gtag/js?id=G-RTX4RL5DN7" 
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RTX4RL5DN7');
            `,
          }}
        />

        {children}
      </body>
    </html>
  );
}