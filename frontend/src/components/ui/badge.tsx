import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  asChild?: boolean;
}

function Badge({
  className = "",
  variant = "default",
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  
  const variantClass = variant !== "default" ? `badge-${variant}` : "badge-primary";
  const classes = `badge ${variantClass} ${className}`.trim();

  return (
    <Comp
      className={classes}
      {...props}
    />
  );
}

export { Badge };
