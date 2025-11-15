"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import CertificateCard from '@/components/CertificateCard';
import ResumeDisplay from '@/components/ResumeDisplay';
import Link from 'next/link';
import { AcademicCapIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {

  const { user, isAuthLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsProfileLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsProfileLoading(true);
      try {
        const response = await fetch('/api/get-my-profile', {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail: user.email }),
        });

        if (!response.ok) {
          if (response.status === 404) setProfile(null);
          else {
            const data = await response.json();
            throw new Error(data.error || "Failed to fetch profile");
          }
        } else {
          const data = await response.json();
          setProfile(data.user);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Spinners / Errors
  if (isAuthLoading || (isProfileLoading && user)) {
    return (
      <div className="flex justify-center items-center h-screen -mt-16">
        <div className="text-gray-400 text-xl animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen -mt-16">
        <p className="text-2xl text-white mb-3">Please log in to view your dashboard.</p>
        <p className="text-gray-500">Use the Login button in the header.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen -mt-16">
        <p className="text-2xl text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-8">

      {/* ----------------- RESUME VIEW ----------------- */}
      {showResume ? (
        <section>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">My Living Resume</h1>
            <button
              onClick={() => setShowResume(false)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Back
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl">
            <ResumeDisplay userEmail={user.email} />
          </div>
        </section>
      ) : (

        <>
          {/* ----------------- CERTIFICATES SECTION ----------------- */}
          <section>
            <h1 className="text-4xl font-bold mb-6 text-white">My Certificates</h1>

            {profile?.verifiedProjects?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {profile.verifiedProjects.map(project => (
                  <CertificateCard key={project._id} project={project} />
                ))}
              </div>
            ) : (
              <div className="p-12 bg-gray-900 border border-gray-800 rounded-xl text-center">
                <AcademicCapIcon className="w-16 h-16 text-blue-500 mx-auto mb-5" />
                <h3 className="text-2xl font-semibold text-white mb-2">No Certificates Yet</h3>
                <p className="text-gray-400 mb-6">
                  Complete your first course to unlock AI-verified certificates.
                </p>

                <Link
                  href="/"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow hover:scale-105 transition"
                >
                  Start a Course
                </Link>
              </div>
            )}
          </section>

          <hr className="my-12 border-gray-800" />

          {/* ----------------- RESUME CARD ----------------- */}
          <section>
            <h2 className="text-4xl font-bold mb-6 text-white">My Resume</h2>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">

              <div className="flex items-center">
                <DocumentTextIcon className="w-16 h-16 text-purple-400 mr-6" />
                <div>
                  <h3 className="text-2xl font-semibold text-white">Build your AI Resume</h3>
                  <p className="text-gray-400 mt-2">
                    Auto-generate a verified resume using your completed certificates & on-chain data.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowResume(true)}
                disabled={!profile?.verifiedProjects?.length}
                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                Generate Resume
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
