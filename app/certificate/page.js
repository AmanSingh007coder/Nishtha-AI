// app/certificate/page.js
"use client";

// This is a simple, read-only component
// In a real app, this would be dynamic, e.g., /certificate/[projectID]

// We'll just hard-code the data for this demo page
// IMPORTANT: Update this with your REAL transaction hash from "Test 5"
const FAKE_PROJECT_DATA = {
  courseName: "MERN Stack Course",
  projectName: "MERN Mini-Capstone 1",
  userEmail: "test@user.com",
  tokenId: "3", // The ID from your last successful test
  transactionHash: "0x...your_hash_here..." // PASTE YOUR REAL HASH HERE
}

export default function CertificatePage() {
  // We'll use the Sepolia Etherscan
  const etherscanUrl = `https://sepolia.etherscan.io/tx/${FAKE_PROJECT_DATA.transactionHash}`;
  
  // We'll use the Testnet OpenSea
  // Make sure you paste your contract address in your .env.local file!
  const contractAddress = process.env.NEXT_PUBLIC_THIRDWEB_CONTRACT_ADDRESS || "";
  const nftUrl = `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${FAKE_PROJECT_DATA.tokenId}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-8">
      <div className="w-full max-w-2xl bg-white text-gray-900 rounded-lg shadow-2xl p-10 border-4 border-blue-500">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">Nishtha AI</h1>
          <p className="text-2xl font-light text-gray-700">Certificate of Verification</p>
        </div>
        
        <p className="text-lg mb-4">This is to certify that:</p>
        <h2 className="text-3xl font-bold text-center mb-6">{FAKE_PROJECT_DATA.userEmail}</h2>
        
        <p className="text-lg mb-4">Has successfully completed and passed the "AI Tech Lead" review for the project:</p>
        <h3 className="text-2xl font-semibold text-center mb-8">{FAKE_PROJECT_DATA.projectName}</h3>
        
        <p className="text-sm text-gray-600 mb-2">As part of the course: {FAKE_PROJECT_DATA.courseName}</p>
        
        <div className="mt-8 pt-4 border-t border-gray-300">
          <h4 className="text-lg font-semibold">Blockchain Proof (Immutable Record)</h4>
          <p className="text-sm text-gray-500 mt-2">
            This achievement has been minted as a "Proof-of-Skill" NFT on the Sepolia Testnet.
          </p>
          
          <p className="mt-4">
            <strong>Token ID:</strong> {FAKE_PROJECT_DATA.tokenId}
          </p>
          <p className="mt-2" style={{ wordBreak: 'break-all' }}>
            <strong>Transaction Hash:</strong>
            {/* --- THIS IS THE FIX ---
              Changed FAKE_NET_PROJECT_DATA to FAKE_PROJECT_DATA
            */}
            <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-2 hover:underline">
              {FAKE_PROJECT_DATA.transactionHash}
            </a>
          </p>
          <p className="mt-4">
            <a href={nftUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">
              View NFT on OpenSea &rarr;
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}