"use client";

import { useState, useEffect } from 'react';
import CV from 'react-cv'; // Make sure you've run: npm install react-cv

// --- THIS IS THE FIX ---
// We create a default "empty" schema.
// This guarantees that all array properties exist,
// so .map() will never be called on 'undefined'.
const DEFAULT_RESUME_DATA = {
  basics: {},
  work: [],
  education: [],
  projects: [],
  skills: [],
  references: [],
  interests: [],
  languages: [],
};
// --- END OF FIX ---

export default function ResumeDisplay({ userEmail }) {
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userEmail) return;

    const fetchResume = async () => {
      try {
        const response = await fetch('/api/generate-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail }),
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        // --- THIS IS THE FIX ---
        // We merge the AI's data (data) on top of our default empty schema.
        // This ensures no array is ever 'undefined'.
        setResumeData({ ...DEFAULT_RESUME_DATA, ...data });
        
      } catch (err) {
        setError(err.message);
      }
    };
    
    fetchResume();
  }, [userEmail]); // Re-run if userEmail changes

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-gray-800 rounded-lg">
        <h1 className="text-2xl text-red-400">Error: {error}</h1>
        <p className="text-gray-400">Could not generate resume. Have you saved any projects yet?</p>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-gray-800 rounded-lg">
        <svg className="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p className="mt-4 text-gray-300 text-lg">Your "Living Resume" is being assembled by AI...</p>
      </div>
    );
  }

  // Once we have data, render the 'react-cv' component
  // The user can now use Ctrl+P or Cmd+P to "Print to PDF"
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <p className="text-gray-800 p-4 font-semibold text-center">Your AI-generated resume is ready. Use your browser's "Print to PDF" (Ctrl+P) to save it.</p>
       <CV {...resumeData} />
    </div>
  );
}