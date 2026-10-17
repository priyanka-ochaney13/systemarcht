'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MessageSquare, Sparkles, X, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/learning', label: 'Learning' },
  { href: '/playground', label: 'Playground' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/ai-architect', label: 'AI Architect', icon: Sparkles, emphasis: true },
  { href: '/chatbot', label: 'ArchBot', icon: MessageSquare },
];

export function SiteHeader({ showLandingAnchors = false }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-4" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">SystemArcht</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {showLandingAnchors && (
            <>
              <a href="#features" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                Features
              </a>
              <a href="#patterns" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                Patterns
              </a>
            </>
          )}
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  link.emphasis
                    ? 'bg-primary font-semibold text-primary-foreground hover:bg-primary/90'
                    : isActive(link.href)
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {showLandingAnchors && (
              <>
                <a href="#features" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                  Features
                </a>
                <a href="#patterns" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                  Patterns
                </a>
              </>
            )}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm',
                  isActive(link.href) ? 'bg-muted font-medium text-foreground' : 'text-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
