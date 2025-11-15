import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import { AuthProvider } from "@/app/context/AuthContext"; // <-- 1. Import our new provider

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Blockchain Learner",
  description: "Learn from any YouTube video and get certified on-chain.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
        {/* 2. Wrap everything in our new, simple provider */}
        <AuthProvider>
          <Header />
          <main className="pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}