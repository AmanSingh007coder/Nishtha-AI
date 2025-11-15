"use client";

import { CheckBadgeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function CertificateCard({ project }) {
  const certificateUrl = `/certificate/${project._id}`;

  return (
    // Gradient border for the "wow" effect
    <div className="p-1 rounded-xl bg-gradient-to-r from-blue-600/50 to-purple-600/50 hover:from-blue-500 hover:to-purple-600 transition-all">
      <Link href={certificateUrl} legacyBehavior>
        <a className="block bg-gray-900 rounded-lg p-6 h-full shadow-lg transition-all transform hover:-translate-y-1">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-800 text-blue-200 rounded-full">
              Course Certificate
            </span>
            <CheckBadgeIcon className="w-8 h-8 text-green-400 flex-shrink-0" />
          </div>

          {/* Body */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {project.courseName}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Verified on: {new Date(project.verifiedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <span className="flex items-center text-blue-400 font-medium">
              View Certificate
              <ArrowTopRightOnSquareIcon className="w-5 h-5 ml-2" />
            </span>
          </div>
        </a>
      </Link>
    </div>
  );
}