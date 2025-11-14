"use client";

import { createContext, useContext, useState } from 'react';

// --- THIS IS THE FAKE USER DATA ---
// 1. Use the same email from your test files ("test@user.com")
// 2. PASTE YOUR METAMASK PUBLIC ADDRESS HERE
const FAKE_USER = {
  email: "test@user.com",
  walletAddress: "0x47995c6be3d4a21745356fab0706c18470959723" // <-- PASTE YOUR ADDRESS
};
// ------------------------------------

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // The user is now "logged in" by default with your fake data
  const [user, setUser] = useState(FAKE_USER);

  // The connectWallet function does nothing, but we keep it
  // so the rest of the app doesn't break if it tries to call it.
  const connectWallet = async () => {
    console.log("Using fake user. No connection needed.");
  };

  const value = { user, connectWallet };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};