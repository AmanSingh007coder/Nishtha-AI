// app/page.js
"use client"; 

import { useState } from 'react';
import CoursePlayer from '@/components/CoursePlayer'; // <-- This will now work!

// This helper function extracts the video ID from any YouTube URL
function extractVideoID(url) {
  try {
    const urlObj = new URL(url);
    // Standard URL: https://www.youtube.com/watch?v=...
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      return urlObj.searchParams.get('v');
    }
    // Shortened URL: https://youtu.be/...
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    return null;
  } catch (e) {
    console.error("Invalid URL", e);
    return null;
  }
}

// A FAKE USER for our demo
// In a real app, this would come from a login system
const FAKE_USER_DATA = {
  email: "aman@example.com",
  walletAddress: "0x47995c6be3d4a21745356fab0706c18470959723" 
  // MAKE SURE THIS IS YOUR REAL METAMASK WALLET ADDRESS
};

export default function Home() {
  const [videoURL, setVideoURL] = useState('https://www.youtube.com/watch?v=l7o9rwHzVdQ');
  const [courseData, setCourseData] = useState(null); // This will hold the AI-generated plan
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // This is our new "master function"
  const handleLoadCourse = async () => {
    setIsLoading(true);
    setError('');
    setCourseData(null);

    const videoID = extractVideoID(videoURL);
    if (!videoID) {
      setError("That doesn't look like a valid YouTube URL.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Call our new "master planner" API
      const response = await fetch('/api/generate-course-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoURL: videoURL }), // Send only the URL
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load course plan.');
      }
      
      // 2. Save the *entire* course plan to our state
      console.log("Successfully fetched course plan:", data);
      setCourseData(data); // data is { videoURL, videoID, courseTitle, modules: [...] }

    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12 bg-gray-900 text-white">
      
      {/* This is a "ternary operator"
          IF courseData is null (we haven't loaded a course), show the Welcome screen.
          ELSE (we *have* loaded a course), show the CoursePlayer.
      */}

      {!courseData ? (
        
        /* --- WELCOME SCREEN --- */
        <>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Nishtha AI</h1>
          <p className="text-lg text-gray-400 mb-8">Paste any YouTube course URL to begin</p>

          <div className="w-full max-w-2xl flex gap-2 mb-8">
            <input
              type="text"
              value={videoURL}
              onChange={(e) => setVideoURL(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-grow p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleLoadCourse}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600"
            >
              {isLoading ? 'Planning...' : 'Load Course'}
            </button>
          </div>

          {error && (
            <div className="w-full max-w-4xl p-4 bg-red-800 text-white rounded-lg mb-4">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col justify-center items-center h-64">
              <svg className="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p className="mt-4 text-gray-300 text-lg">AI is analyzing the entire video and building your course...</p>
              <p className="text-gray-400">This may take up to a minute for long videos.</p>
            </div>
          )}
        </>

      ) : (

        /* --- COURSE PLAYER SCREEN --- */
        <CoursePlayer 
          videoID={courseData.videoID} 
          modules={courseData.modules}
          courseTitle={courseData.courseTitle}
          user={FAKE_USER_DATA} // Pass our fake user data
        />
        
      )}
    </main>
  );
}