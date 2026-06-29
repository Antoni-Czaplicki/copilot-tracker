"use client";

import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";

import { LinkButton } from "./ui/button";

export function NavLinkButton({
  href,
  variant = "ghost",
  ...props
}: ComponentProps<typeof LinkButton>) {
  const pathname = usePathname();
  const hrefValue = typeof href === "string" ? href : href.toString();
  const isCurrent =
    pathname === hrefValue || pathname.startsWith(`${hrefValue}/`);

  return (
    <LinkButton
      aria-current={isCurrent ? "page" : undefined}
      href={href}
      variant={isCurrent ? "secondary" : variant}
      {...props}
    />
  );
}
