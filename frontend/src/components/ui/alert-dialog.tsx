"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root {...props} />;
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger {...props} />;
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal {...props} />;
}

function AlertDialogOverlay({
  className = "",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      className={`alert-dialog-overlay ${className}`}
      {...props}
    />
  );
}

function AlertDialogContent({
  className = "",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={`alert-dialog-content ${className}`}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`alert-dialog-header ${className}`}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`alert-dialog-footer ${className}`}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className = "",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={`alert-dialog-title ${className}`}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className = "",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={`alert-dialog-description ${className}`}
      {...props}
    />
  );
}

function AlertDialogAction({
  className = "",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={`btn btn-primary ${className}`}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className = "",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={`btn btn-outline ${className}`}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};