import type { Metadata } from "next";
import "./globals.css";
import { geistSans } from "@/config/fonts";
import { Providers } from "@/providers/Providers";

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Misproductos",
  description: "Catálogo online personalizable para vender tus productos y servicios",
  openGraph: {
    images: ["/oc_image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Providers>
        <body
          className={`${geistSans.variable} antialiased`}
        >
          {children}
        </body>
      </Providers>
    </html>
  );
}
