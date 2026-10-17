'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MessageSquare, Sparkles, X, Zap } from 'lucide-react';

const navigationLinks = [
  { href: '/learning', label: 'Learning' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/playground', label: 'Playground' },
];

export function SiteHeader({ homeAnchors = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-gray-900"
          aria-label="SystemArcht home"
        >
          <Zap className="h-5 w-5 text-amber-500" />
          SystemArcht
        </Link>

        <nav className="hidden items-center gap-5 md:flex" aria-label="Main navigation">
          {homeAnchors && (
            <>
              <a href="#features" className="text-sm text-gray-700 hover:text-amber-600">
                Features
              </a>
              <a href="#patterns" className="text-sm text-gray-700 hover:text-amber-600">
                Patterns
              </a>
            </>
          )}

          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? 'page'
                  : undefined
              }
              className={`text-sm font-medium hover:text-amber-600 ${
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? 'text-amber-700'
                  : 'text-gray-700'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/ai-architect"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-2 text-sm font-semibold text-gray-950 hover:bg-amber-400"
          >
            <Sparkles className="h-4 w-4" />
            AI Architect
          </Link>

          <Link
            href="/chatbot"
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-2 text-sm font-medium text-amber-400 hover:bg-gray-800"
          >
            <MessageSquare className="h-4 w-4" />
            ArchBot
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 md:hidden"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          className="grid gap-1 border-t border-gray-200 px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          {homeAnchors && (
            <>
              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Features
              </a>
              <a
                href="#patterns"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Patterns
              </a>
            </>
          )}

          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              aria-current={
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? 'page'
                  : undefined
              }
              className={`rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 ${
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? 'font-semibold text-amber-700'
                  : 'text-gray-700'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/ai-architect"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            AI Architect
          </Link>
          <Link
            href="/chatbot"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            ArchBot
          </Link>
        </nav>
      )}
    </header>
  );
}
