import * as React from "react";

function Input({ className = "", type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={`input ${className}`}
      {...props}
    />
  );
}

export { Input };
