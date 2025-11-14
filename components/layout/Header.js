"use client";

import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function Header() {
  const { user } = useAuth(); // We still get the user

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-80 backdrop-blur-md border-b border-gray-700 p-4 z-50">
      <div className="container mx-auto flex justify-between items-center max-w-6xl">
        <Link href="/" className="text-2xl font-bold text-blue-400">
          Nishtha AI
        </Link>
        <div className="flex items-center gap-4">
          {/* Since the user is always logged in, we removed the
            "else" block that showed the 'Connect Wallet' button.
          */}
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                My Dashboard
              </Link>
              <span className="px-4 py-2 bg-gray-800 rounded-full text-sm font-mono">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </span>
            </>
          ) : (
             <p>Loading user...</p> /* This will barely ever show */
          )}
        </div>
      </div>
    </nav>
  );
}