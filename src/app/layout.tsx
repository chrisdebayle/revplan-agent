import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DsProvider } from "@/components/DsProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revenue Plan OS",
  description: "Operator-grade revenue plans for interviews and in-seat, per the Revenue Plan OS doctrine.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Prebuilt design-system stylesheet served from /public — not a
            webpack-bundled asset, so next/font-style handling doesn't apply. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/ds/styles.css" />
      </head>
      <body>
        <DsProvider>{children}</DsProvider>
      </body>
    </html>
  );
}
