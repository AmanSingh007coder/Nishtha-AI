"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate course.');
      }

      // Success! The API returns the course object, which includes the videoID
      // Now we redirect to the course page as per Flow 1.
      router.push(`/course/${data.videoID}`);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-center p-8 -mt-16">
      <h1 className="text-5xl font-extrabold mb-4">
        Turn any YouTube video into an <span className="text-blue-400">on-chain certified course</span>.
      </h1>
      <p className="text-xl text-gray-400 mb-8 max-w-2xl">
        Paste any tutorial. Our AI will build a custom curriculum with quizzes, projects, and blockchain-verified certificates.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={videoURL}
            onChange={(e) => setVideoURL(e.target.value)}
            disabled={isLoading}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-grow p-4 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              "Start Learning"
            )}
          </button>
        </div>
      </form>

      {isLoading && (
        <p className="mt-4 text-gray-300">AI is analyzing your video... this may take a moment.</p>
      )}
      
      {error && (
        <p className="mt-4 p-4 bg-red-900 text-white rounded-lg">{error}</p>
      )}
    </div>
  );
}