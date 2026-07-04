import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisaOps - Visa Lifecycle Management Platform",
  description:
    "Multi-tenant operating system for immigration law firms, clients and partners: intake, case management, documents, workflow, compliance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
