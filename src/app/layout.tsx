import type { Metadata } from "next";
import "./globals.css";
import { geistSans } from "@/config/fonts";
import { Providers } from "@/providers/Providers";

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Teslo-Shop",
  description: "Una tienda virtual de productos",
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
