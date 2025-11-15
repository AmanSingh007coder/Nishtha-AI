// app/resume/page.js
"use client";

import { useState, useEffect } from 'react';
import CV from 'react-cv'; // The library we just installed

// This is a FAKE user for the demo.
// This MUST match the email you used in "Test 4"
const FAKE_USER_EMAIL = "amansinghrajput1610@gmail.com"; 

export default function ResumePage() {
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This runs once when the page loads
    const fetchResume = async () => {
      try {
        const response = await fetch('/api/generate-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: FAKE_USER_EMAIL }),
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        setResumeData(data); // Set the AI-generated JSON
        
      } catch (err) {
        setError(err.message);
      }
    };
    
    fetchResume();
  }, []); // The empty array means this runs once on load

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
        <h1 className="text-2xl text-red-400">Error: {error}</h1>
        <p className="text-gray-400">Could not generate resume. Have you saved any projects yet?</p>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-white">
        <svg className="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p className="mt-4 text-gray-300 text-lg">Your "Living Resume" is being assembled by AI...</p>
      </div>
    );
  }

  // Once we have the data, we render the 'react-cv' component!
  // The user can now use Ctrl+P or Cmd+P to "Print to PDF"
  return (
    <div className="p-4 bg-gray-100">
       <CV {...resumeData} />
    </div>
  );
}