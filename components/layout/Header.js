"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

export default function Header() {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900/70 backdrop-blur-xl border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto py-6 flex items-center justify-between">

        {/* Brand / Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:opacity-90 transition"
        >
          Nishtha AI
        </Link>

        {/* Navigation Items */}
        <div className="hidden md:flex items-center gap-8">

          {/* Home Link */}
          <Link
            href="/"
            className="text-gray-300 hover:text-white transition relative group"
          >
            Home
            <span className="absolute left-0 bottom-[-4px] h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="text-gray-300 hover:text-white transition relative group"
          >
            Dashboard
            <span className="absolute left-0 bottom-[-4px] h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </div>

        {/* User Status */}
        <div>
          {user ? (
            <span className="px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-full text-sm font-mono text-blue-300 shadow-sm">
              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
            </span>
          ) : (
            <span className="px-4 py-2 bg-gray-800/40 border border-gray-700 rounded-full text-sm font-mono text-gray-400">
              Not Connected
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
