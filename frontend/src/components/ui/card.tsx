import * as React from "react";

function Card({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`card ${className}`}
      {...props}
    />
  );
}

function CardHeader({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`card-header ${className}`}
      {...props}
    />
  );
}

function CardTitle({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      className={`text-lg font-semibold ${className}`}
      {...props}
    />
  );
}

function CardDescription({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <p
      className={`text-sm text-muted-foreground ${className}`}
      style={{ color: 'var(--color-muted-foreground)' }}
      {...props}
    />
  );
}

function CardAction({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`card-action ${className}`}
      {...props}
    />
  );
}

function CardContent({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`card-content ${className}`}
      {...props}
    />
  );
}

function CardFooter({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`card-footer ${className}`}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
