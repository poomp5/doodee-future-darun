import "./globals.css";
import { routing } from "@/routing";

// Root layout - basic HTML wrapper; locale layouts provide content/providers
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = routing.defaultLocale ?? "th";

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f7f7fb] font-kanit min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
