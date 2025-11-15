"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckBadgeIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

// Helper component for a single certificate detail
function DetailRow({ label, value, isLink = false, href = "#" }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">
        {isLink ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export default function CertificatePage() {
  const { projectID } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectID) {
      const fetchCertificate = async () => {
        try {
          const res = await fetch(`/api/certificate/${projectID}`);
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          setData(result);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCertificate();
    }
  }, [projectID]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <svg className="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-2xl text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { project, userEmail, userWallet } = data;
  const etherscanUrl = `https://sepolia.etherscan.io/tx/${project.transactionHash}`;
  const contractAddress = process.env.NEXT_PUBLIC_THIRDWEB_CONTRACT_ADDRESS || "";
  const nftUrl = `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${project.tokenId}`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* The "Paper" Certificate */}
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden border-8 border-blue-800">
          <div className="px-8 py-10 md:p-12">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6">
              <div>
                <h1 className="text-4xl font-bold text-blue-900">Nishtha AI</h1>
                <p className="text-2xl font-light text-gray-700">Certificate of Skill Verification</p>
              </div>
              <ShieldCheckIcon className="h-20 w-20 text-green-500 flex-shrink-0" />
            </div>

            {/* Body */}
            <div className="mt-8">
              <p className="text-lg text-gray-600 mb-2">This is to certify that</p>
              <h2 className="text-3xl font-bold text-gray-900">{userEmail}</h2>
              
              <p className="text-lg text-gray-600 mt-6 mb-2">
                has successfully completed the project for the course:
              </p>
              <h3 className="text-3xl font-semibold text-gray-900">{project.courseName}</h3>
              
              <p className="text-md text-gray-600 mt-6">
                This achievement was verified by our AI Tech Lead and recorded immutably
                on the <strong>Sepolia Testnet Blockchain</strong>.
              </p>
            </div>

            {/* Details Section */}
            <div className="mt-10 border-t border-gray-200 pt-6">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">Verification Details</h4>
              <dl>
                <DetailRow label="Student Wallet" value={userWallet} />
                <DetailRow label="Project" value={project.projectBrief} />
                <DetailRow label="Verified On" value={new Date(project.verifiedAt).toLocaleDateString()} />
                <DetailRow label="Token ID" value={project.tokenId} />
                <DetailRow 
                  label="Transaction Hash" 
                  value={project.transactionHash} 
                  isLink={true}
                  href={etherscanUrl}
                />
                <DetailRow 
                  label="View Proof on OpenSea" 
                  value="Click to View NFT" 
                  isLink={true}
                  href={nftUrl}
                />
              </dl>
            </div>

            {/* Footer / Seal */}
            <div className="mt-12 flex justify-end items-center">
              <div className="text-center">
                <CheckBadgeIcon className="h-16 w-16 text-blue-700 mx-auto" />
                <p className="text-sm text-gray-500 font-semibold mt-2">
                  AI & Blockchain Verified
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}