// components/Navbar.jsx
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-infinityBlue text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-infinityPink">
            Infinity
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-infinityPink">
              Home
            </Link>
            <Link href="/register" className="hover:text-infinityPink">
              Register
            </Link>
            <Link href="/login" className="hover:text-infinityPink">
              Login
            </Link>
            <Link href="/dashboard" className="hover:text-infinityPink">
              Dashboard
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden focus:outline-none"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden bg-infinityPurple px-4 py-2 space-y-2">
          <Link href="/" className="block hover:text-infinityPink">
            Home
          </Link>
          <Link href="/register" className="block hover:text-infinityPink">
            Register
          </Link>
          <Link href="/login" className="block hover:text-infinityPink">
            Login
          </Link>
          <Link href="/dashboard" className="block hover:text-infinityPink">
            Dashboard
          </Link>
        </div>
      )}
    </nav>
  );
}
