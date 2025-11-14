// app/dashboard/page.js
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link'; // For linking

// This is a FAKE user for the demo.
// In a real app, you'd get this from your login system.
const FAKE_USER_EMAIL = "test@user.com"; 

// This is a new component we are defining *inside* this file
// It's the "Certificate Card" for each project
function CertificateCard({ project }) {
  const etherscanUrl = `https://sepolia.etherscan.io/tx/${project.transactionHash}`;
  const nftUrl = `https://testnets.opensea.io/assets/sepolia/${process.env.NEXT_PUBLIC_THIRDWEB_CONTRACT_ADDRESS}/${project.tokenId}`;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <h3 className="text-xl font-bold text-blue-400">{project.courseName}</h3>
      <p className="text-lg font-semibold text-white mt-1">{project.projectBrief}</p>
      
      <p className="text-sm text-gray-400 mt-4">AI Feedback:</p>
      <p className="text-sm italic text-gray-300">"{project.aiFeedback}"</p>
      
      <div className="mt-4 pt-4 border-t border-gray-600">
        <h4 className="font-semibold">Blockchain Proof:</h4>
        <p className="text-sm text-gray-400">
          <strong>Token ID:</strong> {project.tokenId}
        </p>
        <p className="text-sm text-gray-400 truncate">
          <strong>Tx Hash:</strong> 
          <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
            {project.transactionHash}
          </a>
        </p>
        <a href={nftUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:underline mt-2 inline-block">
          View NFT on OpenSea &rarr;
        </a>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This runs once when the page loads
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/get-my-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: FAKE_USER_EMAIL }),
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        setUserData(data.user);
        
      } catch (err) {
        setError(err.message);
      }
      setIsLoading(false);
    };
    
    fetchProfile();
  }, []); // The empty array means this runs once on load

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">My Dashboard</h1>

      {isLoading && (
        <div className="flex flex-col justify-center items-center h-64">
          <svg className="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p className="mt-4 text-gray-300 text-lg">Loading Your Verified Projects...</p>
        </div>
      )}

      {error && (
        <div className="w-full max-w-4xl p-4 bg-red-800 text-white rounded-lg mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {userData && (
        <div className="w-full max-w-4xl">
          <div className="mb-8 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold">Welcome, {userData.email}</h2>
            <p className="text-gray-400">You have {userData.verifiedProjects.length} verified projects.</p>
          </div>
          
          {/* This is the "Certificate" list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userData.verifiedProjects.map((project) => (
              <CertificateCard key={project._id} project={project} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-blue-400 hover:underline">
              &larr; Back to Course
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}