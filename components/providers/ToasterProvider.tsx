"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      theme="dark"
      style={{
        "--sonner-color-background": "#0f1a2e",
        "--sonner-color-foreground": "#ffffff",
        "--sonner-color-success": "#9feb00",
        "--sonner-color-error": "#ef4444",
        "--sonner-color-warning": "#f59e0b",
        "--sonner-color-info": "#3b82f6",
        "--sonner-border-color": "#1a2a47",
      } as React.CSSProperties}
    />
  );
}

