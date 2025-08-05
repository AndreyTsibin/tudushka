import * as React from "react";

function Textarea({ className = "", ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={`textarea ${className}`}
      {...props}
    />
  );
}

export { Textarea };
