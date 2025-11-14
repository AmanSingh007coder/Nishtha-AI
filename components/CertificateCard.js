"use client";

import { CheckBadgeIcon, CodeBracketIcon, SparklesIcon } from '@heroicons/react/20/solid';

export default function CertificateCard({ project }) {
  const etherscanUrl = `https://sepolia.etherscan.io/tx/${project.transactionHash}`;
  const contractAddress = process.env.NEXT_PUBLIC_THIRDWEB_CONTRACT_ADDRESS || "";
  const nftUrl = `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${project.tokenId}`;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-blue-500/20 hover:scale-[1.02]">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <CheckBadgeIcon className="w-8 h-8 text-green-400 flex-shrink-0" />
          <h3 className="text-2xl font-bold text-white truncate">{project.courseName}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">Verified on: {new Date(project.verifiedAt).toLocaleDateString()}</p>
        
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <p className="flex items-center gap-2 text-md font-semibold text-gray-200">
            <SparklesIcon className="w-5 h-5 text-yellow-400" />
            AI Feedback:
          </p>
          <p className="text-gray-300 italic mt-2">"{project.aiFeedback}"</p>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-2 text-md font-semibold text-gray-200">
            <CodeBracketIcon className="w-5 h-5 text-blue-400" />
            Skills:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.skills.map(skill => (
              <span key={skill} className="px-3 py-1 bg-blue-800 text-blue-200 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700 flex flex-col sm:flex-row gap-4">
          <a
            href={etherscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
          >
            View Transaction
          </a>
          <a
            href={nftUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            View NFT on OpenSea
          </a>
        </div>
      </div>
    </div>
  );
}