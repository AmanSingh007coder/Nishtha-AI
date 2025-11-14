"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import CoursePlayer from '@/components/CoursePlayer'; // Your component

// Helper icon (This part is unchanged)
const ModuleIcon = ({ isComplete, isCurrent }) => (
  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${isCurrent ? 'bg-blue-500' : isComplete ? 'bg-green-500' : 'bg-gray-700'}`}>
    {isComplete ? (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
    ) : isCurrent ? (
      <svg className="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
    ) : (
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    )}
  </div>
);

export default function CoursePage() {
  const { videoID } = useParams();
  const { user } = useAuth(); // We get the fake user
  
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  useEffect(() => {
    if (!videoID) return;

    const fetchCourse = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/course/${videoID}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setCourse(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [videoID]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen -mt-16">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p className="mt-4 text-gray-300 text-lg">Loading your course...</p>
        </div>
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

  // --- THIS BLOCK IS REMOVED ---
  // We no longer need to check if the user is logged in,
  // because our fake user is ALWAYS logged in.
  /*
  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen -mt-16">
        <p className="text-2xl mb-4">Please connect your wallet to start the course.</p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }
  */

  if (!course) {
    return null; // Should be handled by loading/error states
  }

  return (
    <div className="container mx-auto max-w-7xl p-8">
      <h1 className="text-4xl font-bold mb-6">{course.courseTitle}</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Content: The Player */}
        <div className="flex-grow lg:w-3/4">
          <CoursePlayer
            videoID={videoID}
            modules={course.modules}
            user={user} // We pass the fake user object here
            courseTitle={course.courseTitle}
            currentModuleIndex={currentModuleIndex}
            setCurrentModuleIndex={setCurrentModuleIndex}
          />
        </div>

        {/* Sidebar: Module List (Unchanged) */}
        <aside className="w-full lg:w-1/4 bg-gray-800 rounded-lg p-6 h-fit lg:sticky lg:top-24">
          <h2 className="text-2xl font-semibold mb-6">Course Modules</h2>
          <ul className="space-y-4">
            {course.modules.map((mod, index) => {
              const isComplete = index < currentModuleIndex;
              const isCurrent = index === currentModuleIndex;
              
              return (
                <li key={index} className={`flex items-center p-3 rounded-lg ${isCurrent ? 'bg-blue-900' : ''}`}>
                  <ModuleIcon isComplete={isComplete} isCurrent={isCurrent} />
                  <span className={` ${isCurrent ? 'text-white font-bold' : isComplete ? 'text-gray-400 line-through' : 'text-gray-300'}`}>
                    {mod.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}