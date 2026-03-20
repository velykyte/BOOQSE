"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/stats", label: "Stats" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/profile", label: "Profile" },
] as const;

function navClass(active: boolean) {
  return active
    ? "text-[var(--surface)] font-medium"
    : "text-[var(--surface)]/80 hover:text-[var(--surface)]";
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <nav
        className="hidden border-b border-[var(--brand-burgundy-hover)] bg-[var(--brand-burgundy)] md:block"
        aria-label="Main"
      >
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            aria-label="Booqse"
            className="flex items-center text-[var(--surface)]"
          >
            {/* Inline SVG so it inherits navbar text color (`currentColor`). */}
            <svg
              width="76"
              height="23"
              viewBox="0 0 76 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-auto md:h-7"
            >
              <path
                d="M6.3225 17.1C5.3325 17.1 4.2975 16.83 3.465 16.3575L2.205 16.8975L1.6875 16.56V3.4425C1.6875 2.52 1.4625 2.205 0.8325 2.0475L0 1.8675V1.305L3.375 0L3.8925 0.315V7.155C4.9275 5.985 6.1875 5.355 7.515 5.355C10.26 5.355 12.2175 7.605 12.2175 10.7775C12.2175 14.6925 9.945 17.1 6.3225 17.1ZM6.435 16.065C8.4375 16.065 9.8325 14.175 9.8325 11.4525C9.8325 8.685 8.595 7.02 6.5925 7.02C5.6025 7.02 4.59 7.5375 3.8925 8.415V13.815C3.9825 15.21 4.9725 16.065 6.435 16.065Z"
                fill="currentColor"
              />
              <path
                d="M20.0533 17.1C16.7008 17.1 14.4508 14.7825 14.4508 11.2275C14.4508 7.8075 16.8358 5.355 20.0533 5.355C23.4058 5.355 25.6333 7.695 25.6333 11.25C25.6333 14.67 23.2708 17.1 20.0533 17.1ZM20.0533 16.0425C22.0108 16.0425 23.2258 14.22 23.2258 11.25C23.2258 8.2575 22.0108 6.4125 20.0533 6.4125C18.0958 6.4125 16.8583 8.2575 16.8583 11.2275C16.8583 14.1975 18.0958 16.0425 20.0533 16.0425Z"
                fill="currentColor"
              />
              <path
                d="M33.4566 17.1C30.1041 17.1 27.8541 14.7825 27.8541 11.2275C27.8541 7.8075 30.2391 5.355 33.4566 5.355C36.8091 5.355 39.0366 7.695 39.0366 11.25C39.0366 14.67 36.6741 17.1 33.4566 17.1ZM33.4566 16.0425C35.4141 16.0425 36.6291 14.22 36.6291 11.25C36.6291 8.2575 35.4141 6.4125 33.4566 6.4125C31.4991 6.4125 30.2616 8.2575 30.2616 11.2275C30.2616 14.1975 31.4991 16.0425 33.4566 16.0425Z"
                fill="currentColor"
              />
              <path
                d="M53.5874 22.275H47.4224V21.69L48.3674 21.3525C49.3799 20.9925 49.5824 20.7675 49.5824 20.0925V15.2775C48.5024 16.4475 47.2424 17.1 45.9824 17.1C43.2149 17.1 41.2574 14.8725 41.2574 11.6775C41.2574 7.7625 43.5299 5.355 47.1749 5.355C48.0974 5.355 49.0424 5.6025 49.8974 6.075L51.2699 5.355L51.7874 5.67V20.0925C51.7874 20.79 52.0124 21.105 52.6874 21.3525L53.5874 21.69V22.275ZM46.9049 15.4575C47.8949 15.4575 48.8841 14.94 49.5824 14.0625V8.685C49.5149 7.29 48.5249 6.4125 47.0399 6.4125C45.0374 6.4125 43.6424 8.28 43.6424 11.025C43.6424 13.77 44.9024 15.4575 46.9049 15.4575Z"
                fill="currentColor"
              />
              <path
                d="M59.1057 17.1C57.6657 17.1 56.1132 16.6725 55.0557 15.9075L55.3257 13.2975H55.9332L56.4507 14.355C57.0357 15.435 57.9807 16.0425 59.2182 16.0425C60.5457 16.0425 61.4457 15.3675 61.4457 14.265C61.4457 13.3425 60.8607 12.69 58.5657 11.79C56.2707 10.89 55.2807 9.81 55.2807 8.3925C55.2807 6.57 56.8782 5.355 59.2857 5.355C60.5457 5.355 61.9632 5.67 62.9982 6.1425L62.7507 8.5725H62.1432C61.8282 7.9875 61.5807 7.6275 61.2657 7.2675C60.7932 6.7275 60.0732 6.4125 59.3082 6.4125C58.0707 6.4125 57.2832 6.9975 57.2832 7.83C57.2832 8.685 57.9357 9.2025 60.1632 10.17C62.5932 11.205 63.4932 12.285 63.4932 13.68C63.4932 15.7275 61.7157 17.1 59.1057 17.1Z"
                fill="currentColor"
              />
              <path
                d="M71.0466 17.1C67.7616 17.1 65.6691 15.0525 65.6691 11.2725C65.6691 7.965 67.8741 5.355 70.9341 5.355C73.7466 5.355 75.7041 7.155 75.7941 10.4175V10.9125H68.0541V11.205C68.0541 14.085 69.5391 15.6375 71.9241 15.6375C73.1616 15.6375 74.0841 15.255 74.9841 14.625L75.5241 15.3225C74.3541 16.4475 72.8466 17.1 71.0466 17.1ZM68.1216 9.8775L73.5441 9.81C73.4766 7.7625 72.5091 6.4125 70.9791 6.4125C69.4266 6.4125 68.4141 7.695 68.1216 9.8775Z"
                fill="currentColor"
              />
            </svg>
          </Link>
          <ul className="flex gap-8">
            {NAV.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link href={href} className={`text-sm transition-colors ${navClass(active)}`}>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-[var(--brand-burgundy-hover)] bg-[var(--brand-burgundy)] md:hidden"
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-[1200px] justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {NAV.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href} className="flex-1 text-center">
                <Link
                  href={href}
                  className={`block py-2 text-xs ${navClass(active)}`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
