"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "lib/auth/client";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authClient.getSession();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const publicNavItems = [
    { label: "Platform", href: "#platform" },
    { label: "Integrations", href: "#integrations" },
    { label: "Docs", href: "#docs" },
    { label: "Pricing", href: "#pricing" },
  ];

  const authenticatedNavItems = [
    { label: "Chat", href: "/chat" },
    { label: "Agents", href: "/chat/agents" },
    { label: "Workflows", href: "/chat/workflow" },
    { label: "MCPs", href: "/chat/mcp" },
    { label: "Archive", href: "/chat/archive" },
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  const handleProtectedLink = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated && !isLoading) {
      e.preventDefault();
      window.location.href = "/sign-in";
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary-foreground"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-xl font-semibold">Squid</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => handleProtectedLink(e)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {!isLoading && (
              <Button className="hidden sm:inline-flex" asChild>
                <Link href={isAuthenticated ? "/chat" : "/sign-up"}>
                  {isAuthenticated ? "Go to Chat" : "Get started"}
                </Link>
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  onClick={(e) => {
                    handleProtectedLink(e);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2">
                <Button className="w-full" asChild>
                  <Link href={isAuthenticated ? "/chat" : "/sign-up"}>
                    {isAuthenticated ? "Go to Chat" : "Get started"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
