"use client";

import { createContext, useContext } from 'react';

// --- THIS IS YOUR FAKE USER ---
// 1. Use the email from your tests
// 2. Use your MetaMask wallet address
const HARDCODED_USER = {
  email: "amansinghrajput1610@gmail.com",
  walletAddress: "0x47995c6be3d4a21745356fab0706c18470959723" // <-- PASTE YOUR ADDRESS
};
// ---------------------------------

// Create the context
const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
  
  // The value is now static.
  // The user is ALWAYS logged in.
  // The app is NEVER loading.
  const value = {
    user: HARDCODED_USER,
    isAuthLoading: false 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create the hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};