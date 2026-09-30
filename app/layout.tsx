import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "너혹시 | 밈 기반 심리테스트",
  description: "너 혹시 T야? 너 혹시 연애 호구야? 밈 화법 심리테스트 플랫폼",
  metadataBase: new URL("https://nuhoxy.com"),
  openGraph: {
    title: "너혹시 | 밈 기반 심리테스트",
    description: "너 혹시 T야? 너 혹시 연애 호구야? 밈 화법 심리테스트 플랫폼",
    siteName: "너혹시",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "너혹시 | 밈 기반 심리테스트",
    description: "너 혹시 T야? 너 혹시 연애 호구야? 밈 화법 심리테스트 플랫폼",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
