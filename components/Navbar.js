// components/Navbar.js
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-infinityBlue text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="text-xl font-bold">Infinity</div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-infinityPink">
              Home
            </Link>
            <Link href="/about" className="hover:text-infinityPink">
              About
            </Link>
            <Link href="/register" className="hover:text-infinityPink">
              Register
            </Link>
            <Link href="/login" className="hover:text-infinityPink">
              Login
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-infinityBlue px-4 pb-4 space-y-2">
          <Link href="/" className="block hover:text-infinityPink">
            Home
          </Link>
          <Link href="/about" className="block hover:text-infinityPink">
            About
          </Link>
          <Link href="/register" className="block hover:text-infinityPink">
            Register
          </Link>
          <Link href="/login" className="block hover:text-infinityPink">
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
