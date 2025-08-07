"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

interface ToasterComponentProps extends ToasterProps {
  theme?: "light" | "dark";
}

const Toaster = ({ theme = "light", ...props }: ToasterComponentProps) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--color-card)",
          "--normal-text": "var(--color-card-foreground)",
          "--normal-border": "var(--color-border)",
          "--success-bg": "var(--color-card)",
          "--success-text": "var(--color-card-foreground)",
          "--success-border": "var(--color-border)",
          "--error-bg": "var(--color-card)",
          "--error-text": "var(--color-card-foreground)",
          "--error-border": "var(--color-border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
