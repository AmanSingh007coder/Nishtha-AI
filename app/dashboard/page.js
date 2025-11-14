"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import CertificateCard from '@/components/CertificateCard';
import ResumeDisplay from '@/components/ResumeDisplay';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State to toggle between views
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return; // Wait for user to be available
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/get-my-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: user.email }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        setProfile(data.user);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]); // Re-fetch when user logs in

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen -mt-16">
        <p className="text-lg">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen -mt-16">
        <p className="text-2xl">Please connect your wallet to view your dashboard.</p>
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
      {showResume ? (
        // --- RESUME VIEW ---
        <section>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold">My Living Resume</h1>
            <button
              onClick={() => setShowResume(false)}
              className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              &larr; Back to Dashboard
            </button>
          </div>
          <ResumeDisplay userEmail={user.email} />
        </section>

      ) : (
        // --- DEFAULT DASHBOARD VIEW ---
        <>
          <section id="certificates">
            <h1 className="text-4xl font-bold mb-6">My Certificates</h1>
            {profile && profile.verifiedProjects && profile.verifiedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {profile.verifiedProjects.map(project => (
                  <CertificateCard key={project._id || project.transactionHash} project={project} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg">
                <p className="text-xl text-gray-400">You haven't earned any verified certificates yet.</p>
                <Link href="/" className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                  Start a new course
                </Link>
              </div>
            )}
          </section>

          <hr className="my-12 border-gray-700" />

          <section id="resume">
            <h2 className="text-4xl font-bold mb-6">My Resume</h2>
            <div className="p-8 bg-gray-800 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-semibold">Ready for your next role?</h3>
                <p className="text-gray-400 mt-2">Generate a "Living Resume" powered by AI, complete with all your on-chain verified skills and projects.</p>
              </div>
              <button
                onClick={() => setShowResume(true)}
                disabled={!profile || !profile.verifiedProjects || profile.verifiedProjects.length === 0}
                className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Generate My AI Resume
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}