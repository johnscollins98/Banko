"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ThemeProvider attribute="class" enableSystem defaultTheme="system">
        <ToastProvider toastProps={{ timeout: 2000 }} />
        {children}
      </ThemeProvider>
    </HeroUIProvider>
  );
}
