import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Z Lab Design — Luxury Car Detailing Studio, Indirapuram',
  description:
    "World-class PPF, Ceramic Coating, and Graphene finishes for the world's most prestigious vehicles. Indirapuram, Ghaziabad.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded the same way as the original prototype (runtime <link>
            tags) rather than next/font/google, which needs to reach
            fonts.googleapis.com at *build* time -- not guaranteed on every
            build host/network. Fonts still resolve fine for visitors either
            way; see globals.css for the --font-* variable definitions. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,600;0,700;0,800;0,900;1,800;1,900&family=Unbounded:wght@700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Mirrors the original prototype's progressive-enhancement trick:
          .reveal elements start visible; this class (added before paint)
          switches them to the pre-animation state so users never see a
          flash of hidden content if JS fails to load. */}
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
      />
      <body className="font-inter">{children}</body>
    </html>
  );
}
