"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CoursePlayer from '@/components/CoursePlayer';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';

// Module icon handler
const ModuleIcon = ({ isComplete, isCurrent }) => {
  if (isComplete)
    return <CheckCircleIcon className="w-6 h-6 text-green-500 mr-4" />;
  if (isCurrent)
    return <SparklesIcon className="w-6 h-6 text-blue-400 mr-4" />;
  return <LockClosedIcon className="w-6 h-6 text-gray-500 mr-4" />;
};

export default function CoursePage() {
  const { videoID } = useParams();

  const [course, setCourse] = useState(null);
  const [isCourseLoading, setIsCourseLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  // Fetch Course Data
  useEffect(() => {
    if (!videoID) return;

    const fetchCourse = async () => {
      setIsCourseLoading(true);
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
        setIsCourseLoading(false);
      }
    };

    fetchCourse();
  }, [videoID]);

  // Loading Screen
  if (isCourseLoading) {
    return (
      <div className="flex justify-center items-center h-screen -mt-16">
        <svg className="animate-spin h-12 w-12 text-blue-400 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-6 text-gray-300 text-lg">Loading your course...</p>
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

  if (!course) return null;

  return (
    <div className="flex w-full">

      {/* Left Main Section */}
      <div className="flex-grow max-w-6xl p-10 lg:ml-10">
        <h1 className="text-4xl font-bold mb-8 text-white">
          {course.courseTitle}
        </h1>

        <CoursePlayer
          videoID={videoID}
          modules={course.modules}
          courseTitle={course.courseTitle}
          currentModuleIndex={currentModuleIndex}
          setCurrentModuleIndex={setCurrentModuleIndex}
        />
      </div>

      {/* Right Sidebar FIXED */}
      <aside className="
        hidden lg:flex 
        flex-col 
        w-[350px] 
        h-screen 
        sticky top-0 
        right-0 
        bg-gray-900/80 
        border-l border-gray-700 
        backdrop-blur-xl 
        p-8 
        overflow-y-auto
        shadow-xl
      ">
        <h2 className="text-2xl font-semibold text-white mb-6">
          Course Modules
        </h2>

        <ul className="space-y-4">
          {course.modules.map((mod, index) => {
            const isComplete = index < currentModuleIndex;
            const isCurrent = index === currentModuleIndex;

            return (
              <li
                key={index}
                onClick={() => setCurrentModuleIndex(index)}
                className={`
                  flex items-center p-4 rounded-lg cursor-pointer transition-all border 
                  ${
                    isCurrent
                      ? "bg-blue-600/20 border-blue-400 shadow-md"
                      : "bg-gray-800/40 border-gray-700 hover:bg-gray-700/40"
                  }
                `}
              >
                <ModuleIcon isComplete={isComplete} isCurrent={isCurrent} />

                <span
                  className={`
                    text-sm 
                    ${
                      isCurrent
                        ? "text-white font-bold"
                        : isComplete
                        ? "text-gray-500 line-through"
                        : "text-gray-300"
                    }
                  `}
                >
                  {mod.name}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
