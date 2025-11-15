"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { FaYoutube } from "react-icons/fa";

export default function HomePage() {
  const [videoURL, setVideoURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoURL) {
      setError('Please enter a YouTube URL.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-course-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoURL }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate course.');
      
      router.push(`/course/${data.videoID}`);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-center p-8 -mt-16 relative overflow-hidden bg-black">

      {/* Subtle floating YouTube icons */}
      <FaYoutube className="text-red-600 absolute top-20 left-16 w-14 h-14 opacity-25 animate-float-slow" />
      <FaYoutube className="text-red-600 absolute bottom-20 right-20 w-16 h-16 opacity-25 animate-float" />
      <FaYoutube className="text-red-600 absolute top-1/2 left-1/4 w-10 h-10 opacity-25 animate-float-delayed"/>
      <FaYoutube className="text-red-600 absolute bottom-1/2 right-40 w-16 h-16 opacity-25 animate-float" />
      <FaYoutube className="text-red-600 absolute bottom-20 left-20 w-16 h-16 opacity-25 animate-float" />
      <FaYoutube className="text-red-600 absolute top-23 left-1/2 w-10 h-10 opacity-25 animate-float-delayed"/>

      {/* Main container */}
      <div className="flex flex-col items-center max-w-3xl z-10">

        {/* Tagline (Gradient, Single Line) */}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 
                       bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 
                       text-transparent bg-clip-text whitespace-nowrap">
          Learn Smarter. Certify Faster.
        </h1>

        {/* Sub-text bright white */}
        <p className="text-xl md:text-2xl text-white font-semibold mb-10 opacity-90">
          Turn any YouTube tutorial into an AI-powered course with quizzes, projects & certificates.
        </p>

        {/* Input field */}
        <form 
          onSubmit={handleSubmit} 
          className="w-full max-w-2xl bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl shadow-xl"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={videoURL}
              onChange={(e) => setVideoURL(e.target.value)}
              disabled={isLoading}
              placeholder="Paste your YouTube video URL here..."
              className="flex-grow p-4 rounded-lg bg-gray-900 border border-gray-700 
                         text-white placeholder-gray-500 focus:outline-none 
                         focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 
                         text-white font-bold rounded-lg shadow-lg 
                         hover:from-blue-600 hover:to-purple-700 
                         transition-all duration-300 transform hover:scale-105 
                         disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white mx-auto"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" 
                          stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <span className="flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Start Learning
                </span>
              )}
            </button>
          </div>

          {isLoading && <p className="mt-4 text-gray-200">AI is analyzing your video...</p>}
          {error && <p className="mt-4 p-3 bg-red-900 text-white rounded-lg">{error}</p>}
        </form>
      </div>

      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .animate-float { animation: float 4s ease-in-out infinite; }
          .animate-float-slow { animation: float 6s ease-in-out infinite; }
          .animate-float-delayed { animation: float 5s ease-in-out infinite 1s; }
        `}
      </style>
    </div>
  );
}
