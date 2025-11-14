"use client"; 

import { useState, useRef, useEffect } from 'react';

// ---------------------------------
//  OUR HACKATHON "DATABASE"
// ---------------------------------
const VIDEO_ID = 'l7o9rwHzVdQ'; // Extracted from the YouTube URL

const MODULES = [
  { 
    name: "Chapter 1: Variables & Data Types",
    startTime: 0,
    endTime: 180,
    type: 'quiz',
  },
  { 
    name: "Chapter 2: Arrays & Objects",
    startTime: 180,
    endTime: 360,
    type: 'quiz',
  },
  {
    name: "Chapter 3: Functions & 'this'",
    startTime: 360,
    endTime: 540,
    type: 'project',
  },
  {
    name: "Course Complete!",
    startTime: 540,
    endTime: 10000,
    type: 'complete',
  }
];

export default function Home() {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('quiz');
  const [modalData, setModalData] = useState(null);
  const [modalError, setModalError] = useState('');
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const iframeRef = useRef(null);

  // Load YouTube IFrame API
  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API Ready!');
      const newPlayer = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            console.log('✅ Player ready!');
            setPlayer(event.target);
          },
          onStateChange: (event) => {
            console.log('Player state:', event.data);
            if (event.data === window.YT.PlayerState.PLAYING) {
              console.log('▶️ Playing');
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              console.log('⏸️ Paused');
              setIsPlaying(false);
            }
          },
        },
      });
    };
  }, []);

  // Check progress every second
  useEffect(() => {
    if (!player || !isPlaying) return;

    const interval = setInterval(() => {
      if (player.getCurrentTime) {
        const time = player.getCurrentTime();
        setCurrentTime(time);
        
        const currentModule = MODULES[currentModuleIndex];
        
        if (time >= currentModule.endTime && !showModal && !isModalLoading) {
          console.log(`Hit gate for ${currentModule.name}! Pausing video.`);
          player.pauseVideo();
          setShowModal(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, isPlaying, currentModuleIndex, showModal, isModalLoading]);

  useEffect(() => {
    if (showModal) {
      const currentModule = MODULES[currentModuleIndex];
      setModalType(currentModule.type);
      
      if (currentModule.type === 'quiz') {
        generateQuiz();
      } else if (currentModule.type === 'project') {
        generateProject();
      }
    }
  }, [showModal, currentModuleIndex]);

  const generateQuiz = async () => {
    console.log("Generating quiz...");
    setIsModalLoading(true);
    setModalData(null);
    setModalError('');

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoURL: `https://www.youtube.com/watch?v=${VIDEO_ID}` }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      
      console.log("Quiz data received:", data);
      setModalData(data.quiz);
    } catch (err) {
      console.error(err);
      setModalError(err.message);
    }
    setIsModalLoading(false);
  };
  
  const generateProject = () => {
    console.log("Generating project...");
    setIsModalLoading(true);
    setModalData(null);
    setModalError('');
    
    setTimeout(() => {
      setModalData({ 
        brief: "Build a simple 'Hello World' app using what you just learned. This will be verified by our AI Tech Lead." 
      });
      setIsModalLoading(false);
    }, 1000);
  };

  const handleModalSuccess = () => {
    console.log("Module passed! Unlocking next chapter.");
    setShowModal(false);
    setIsModalLoading(false);
    
    const nextIndex = currentModuleIndex + 1;
    if (nextIndex < MODULES.length) {
      setCurrentModuleIndex(nextIndex);
      const nextModuleStartTime = MODULES[nextIndex].startTime;
      
      if (player && player.seekTo) {
        player.seekTo(nextModuleStartTime, true);
        player.playVideo();
      }
    } else {
      alert("Congratulations! You completed the course!");
    }
  };

  const handlePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12 bg-gray-900 text-white">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Nishtha AI - Learn JavaScript</h1>
      <p className="text-lg text-gray-400 mb-8">
        Module {currentModuleIndex + 1} of {MODULES.length}: {MODULES[currentModuleIndex].name}
      </p>

      {/* Video Player Container */}
      <div className="w-full max-w-4xl">
        <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black">
          <div id="youtube-player" className="w-full h-full"></div>
        </div>
        
        {/* Controls & Debug Info */}
        <div className="mt-4 space-y-3">
          {/* Manual Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handlePlayPause}
              disabled={!player}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'} Video
            </button>
          </div>

          {/* Debug Info */}
          <div className="p-4 bg-gray-800 rounded-lg text-sm">
            <p className="text-gray-300 mb-2"><strong>Status:</strong></p>
            <p className="text-gray-400">• Player loaded: {player ? '✅ Yes' : '❌ No'}</p>
            <p className="text-gray-400">• Playing: {isPlaying ? '▶️ Yes' : '⏸️ No'}</p>
            <p className="text-gray-400">• Current time: {Math.floor(currentTime)}s</p>
            <p className="text-gray-400">• Next checkpoint: {MODULES[currentModuleIndex].endTime}s</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-gray-800 w-full max-w-md m-4 p-6 rounded-2xl shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">Checkpoint!</h2>
              <p className="text-gray-400">
                You've reached the end of "{MODULES[currentModuleIndex].name}".
              </p>
            </div>

            <div className="py-4 min-h-[150px]">
              {isModalLoading && (
                <div className="flex flex-col justify-center items-center h-24">
                  <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <p className="mt-4 text-gray-300">AI is generating your challenge...</p>
                </div>
              )}

              {modalError && (
                <p className="text-red-400">{modalError}</p>
              )}

              {modalType === 'quiz' && modalData && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-lg">Quiz Time!</h3>
                  <p className="text-gray-200">{modalData[0].question}</p>
                  <div className="flex flex-col gap-2">
                    {modalData[0].options.map((opt, i) => (
                      <button 
                        key={i} 
                        className="w-full p-3 text-left bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modalType === 'project' && modalData && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-lg">Project Time!</h3>
                  <p className="text-gray-200">{modalData.brief}</p>
                  <p className="text-sm text-gray-400">
                    Go build this in your repo, then click "Submit Project" to continue.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-700">
              <button
                onClick={handleModalSuccess}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
              >
                {modalType === 'project' ? "Submit Project (Demo)" : "Finish Quiz (Demo)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}