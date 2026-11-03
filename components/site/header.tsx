"use client";

import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/brand/mahira";
import { ArrowIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";
import { navigation } from "@/lib/landing-content";

function LanguageSwitcher() {
  return (
    <div className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em]">
      <span
        aria-current="true"
        className="border-b border-orange pb-0.5 text-white"
      >
        ID
      </span>
      <span aria-hidden="true" className="text-white/35">
        /
      </span>
      <span
        className="inline-flex items-baseline gap-1.5 text-white"
        lang="en"
        title="Versi Inggris segera hadir"
      >
        EN
        <span className="text-[0.5625rem] tracking-[0.1em] text-white">
          segera
        </span>
      </span>
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="on-dark sticky top-0 z-50 border-b border-white/15 bg-brand-500 text-white">
      <div className="container-editorial flex h-20 items-center justify-between gap-6">
        <a
          className="shrink-0"
          href="#beranda"
          onClick={closeMenu}
        >
          <Logo
            className="h-7 w-auto sm:h-8"
            priority
            tone="emblem"
          />
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-8 lg:flex"
        >
          {navigation.map((item) => (
            <a
              className="text-[0.8125rem] font-semibold text-white underline-offset-4 transition-colors hover:underline"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          <LanguageSwitcher />
          <a className="btn btn-light" href="#publikasi">
            Jelajahi publikasi
            <ArrowIcon className="h-3.5 w-3.5" />
          </a>
        </div>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={open}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-white/35 px-3 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white hover:bg-white/10 lg:hidden"
          onClick={() => setOpen((current) => !current)}
          ref={menuButtonRef}
          type="button"
        >
          {open ? (
            <CloseIcon className="h-4 w-4" />
          ) : (
            <MenuIcon className="h-4 w-4" />
          )}
          <span>{open ? "Tutup" : "Menu"}</span>
        </button>
      </div>

      {open ? (
        <div
          className="border-t border-white/15 bg-brand-500 lg:hidden"
          id="mobile-navigation"
        >
          <div className="container-editorial py-4">
            <nav aria-label="Navigasi seluler">
              <ul className="divide-y divide-white/15 border-y border-white/15">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <a
                      className="flex items-center justify-between py-4 text-base font-semibold text-white"
                      href={item.href}
                      onClick={closeMenu}
                    >
                      {item.label}
                      <ArrowIcon className="h-4 w-4 text-white/60" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-5 flex items-center justify-between gap-4">
              <LanguageSwitcher />
              <a
                className="btn btn-light"
                href="#publikasi"
                onClick={closeMenu}
              >
                Jelajahi publikasi
                <ArrowIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
