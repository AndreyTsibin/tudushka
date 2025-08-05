import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { Button } from "./button";

function Pagination({ className = "", ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={`pagination ${className}`}
      {...props}
    />
  );
}

function PaginationContent({
  className = "",
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={`pagination-content ${className}`}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li className="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className = "",
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  const activeClass = isActive ? "btn-outline" : "btn-ghost";
  const sizeClass = size !== "default" ? `btn-${size}` : "";
  
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={`btn ${activeClass} ${sizeClass} pagination-link ${className}`}
      {...props}
    />
  );
}

function PaginationPrevious({
  className = "",
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={`pagination-previous ${className}`}
      {...props}
    >
      <ChevronLeftIcon size={16} />
      <span className="pagination-text">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className = "",
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={`pagination-next ${className}`}
      {...props}
    >
      <span className="pagination-text">Next</span>
      <ChevronRightIcon size={16} />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className = "",
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={`pagination-ellipsis ${className}`}
      {...props}
    >
      <MoreHorizontalIcon size={16} />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};