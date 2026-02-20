import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import LiquidGlass from "../LiquidGlass";

function Header() {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <LiquidGlass
        className="w-full"
        roundness="rounded-none"
        opacity={0.3}
        blur={15}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div
              onClick={() => router.push("/")}
              className="flex items-center gap-2 cursor-pointer"
              aria-label="Home"
            >
              <Image
                src="/img/only_logo.png"
                alt="UniHub logo"
                width={32}
                height={32}
                priority
              />
              <span className="text-xl font-extrabold tracking-tight heading-font text-gray-900">
                UniHub
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-gray-700 hover:text-[color:var(--darker-secondary-color)] cursor-pointer"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-gray-700 hover:text-[color:var(--darker-secondary-color)] cursor-pointer"
              >
                About
              </a>
              <a
                href="#faqs"
                className="text-gray-700 hover:text-[color:var(--darker-secondary-color)] cursor-pointer"
              >
                FAQs
              </a>
              <Link
                href="/users/signup"
                tabIndex={-1}
                aria-disabled="true"
                className="pointer-events-none px-5 py-2.5 rounded-xl text-white font-bold bg-[color:var(--secondary-color)] hover:bg-[color:var(--darker-secondary-color)] transition-colors shadow-lg shadow-blue-200/50"
              >
                Try UniHub
              </Link>
            </nav>
            <div className="md:hidden">
              <Link
                href="/users/signup"
                className="px-5 py-2.5 rounded-xl text-white font-bold bg-[color:var(--secondary-color)] hover:bg-[color:var(--darker-secondary-color)] transition-colors"
              >
                Try UniHub
              </Link>
            </div>
          </div>
        </div>
      </LiquidGlass>
    </header>
  );
}

export default Header;
