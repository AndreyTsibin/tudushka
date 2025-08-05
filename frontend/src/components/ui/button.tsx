import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

function Button({
  className = "",
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const baseClass = "btn";
  const variantClass = variant !== "default" ? `btn-${variant}` : "btn-primary";
  const sizeClass = size !== "default" ? `btn-${size}` : "";
  
  const classes = [baseClass, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Comp
      className={classes}
      {...props}
    />
  );
}

export { Button };
