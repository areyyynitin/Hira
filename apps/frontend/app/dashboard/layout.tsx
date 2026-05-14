"use client";

import { SidebarProvider } from "@/src/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SidebarProvider defaultOpen>{children}</SidebarProvider>;
}
