// app/certificate/[projectID]/page.js
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// This is a FAKE user email. In a real app, this would come from auth.
const FAKE_USER_EMAIL = "amansinghrajput1610@gmail.com";

export default function CertificatePage() {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] =useState(true);
  const [error, setError] = useState(null);
  
  const params = useParams(); // This gets the [projectID] from the URL
  const { projectID } = params;

  useEffect(() => {
    if (!projectID) return;

    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // We call our profile API and *then* find the project
        const response = await fetch('/api/get-my-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: FAKE_USER_EMAIL }),
        });

        if (!response.ok) throw new Error("Failed to fetch user data.");
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Find the *specific* project the user clicked on
        const foundProject = data.user.verifiedProjects.find(p => p._id === projectID);
        
        if (!foundProject) throw new Error("Project not found or does not belong to this user.");
        
        setProject(foundProject);

      } catch (err) {
        setError(err.message);
      }
      setIsLoading(false);
    };

    fetchProjectData();
  }, [projectID]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-white">
        <svg className="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p className="mt-4 text-gray-300 text-lg">Loading Your Certificate...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
        <h1 className="text-2xl text-red-400">Error: {error}</h1>
      </div>
    );
  }

  if (!project) return null; // Should be handled by loading/error

  // --- This is the Certificate UI ---
  const etherscanUrl = `https://sepolia.etherscan.io/tx/${project.transactionHash}`;
  const contractAddress = process.env.NEXT_PUBLIC_THIRDWEB_CONTRACT_ADDRESS || "";
  const nftUrl = `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${project.tokenId}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-8">
      <div className="w-full max-w-2xl bg-white text-gray-900 rounded-lg shadow-2xl p-10 border-4 border-blue-500">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">Nishtha AI</h1>
          <p className="text-2xl font-light text-gray-700">Certificate of Verification</p>
        </div>
        
        <p className="text-lg mb-4">This is to certify that:</p>
        <h2 className="text-3xl font-bold text-center mb-6">{FAKE_USER_EMAIL}</h2>
        
        <p className="text-lg mb-4">Has successfully completed and passed the "AI Tech Lead" review for the project:</p>
        <h3 className="text-2xl font-semibold text-center mb-8">{project.projectName || project.courseName}</h3>
        
        <p className="text-sm text-gray-600 mb-2">As part of the course: {project.courseName}</p>
        
        <div className="mt-8 pt-4 border-t border-gray-300">
          <h4 className="text-lg font-semibold">Blockchain Proof (Immutable Record)</h4>
          <p className="text-sm text-gray-500 mt-2">
            This achievement has been minted as a "Proof-of-Skill" NFT on the Sepolia Testnet.
          </p>
          
          <p className="mt-4">
            <strong>Token ID:</strong> {project.tokenId || "N/A"}
          </p>
          <p className="mt-2" style={{ wordBreak: 'break-all' }}>
            <strong>Transaction Hash:</strong>
            <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-2 hover:underline">
              {project.transactionHash || "N/A"}
            </a>
          </p>
          <p className="mt-4">
            <a href={nftUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">
              View NFT on OpenSea &rarr;
            </a>
          </p>
        </div>
        
        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-gray-500 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}