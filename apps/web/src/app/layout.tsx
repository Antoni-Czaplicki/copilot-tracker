import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, LinkButton } from "@/components/ui/button";
import { currentUser, isAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Copilot Tracker",
  description:
    "Track GitHub Copilot usage by developer, workspace, branch, and task.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-mono", jetbrainsMono.variable)}
    >
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="shell">
            <header className="topbar">
              <Link className="brand" href="/">
                <strong>Copilot Tracker</strong>
                <span>Usage attribution for busy engineering teams</span>
              </Link>
              <nav className="nav">
                {user ? (
                  <LinkButton href="/leaderboard" variant="ghost">
                    Leaderboard
                  </LinkButton>
                ) : null}
                {user ? (
                  <LinkButton href="/dashboard" variant="ghost">
                    Dashboard
                  </LinkButton>
                ) : null}
                {isAdmin(user) ? (
                  <LinkButton href="/admin" variant="ghost">
                    Admin
                  </LinkButton>
                ) : null}
                <ThemeToggle />
                {user ? (
                  <form action="/api/auth/logout" method="post">
                    <Button type="submit" variant="secondary">
                      Log out @{user.login}
                    </Button>
                  </form>
                ) : (
                  <LinkButton href="/api/auth/github">
                    Log in with GitHub
                  </LinkButton>
                )}
              </nav>
            </header>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
