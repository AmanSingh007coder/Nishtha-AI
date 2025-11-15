"use client"; 

import React, { useState, useRef, useEffect, Fragment } from 'react';
import { useAuth } from '@/app/context/AuthContext';
// We need more icons for the new UI
import { 
  BeakerIcon, 
  CodeBracketIcon, 
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/solid';

/**
 * NEW: ModalStepper Component
 * This is a visual guide for the user during multi-stage checkpoints.
 */
const ModalStepper = ({ stage }) => {
  const steps = [
    { name: 'Quiz', icon: BeakerIcon, stage: 'quiz' },
    { name: 'Project', icon: CodeBracketIcon, stage: 'project' },
    { name: 'Interview', icon: ChatBubbleLeftRightIcon, stage: 'interview' }
  ];
  // Find which step we're on (0, 1, or 2)
  const stageIndex = steps.findIndex(s => s.stage === stage);

  return (
    <nav className="flex items-center justify-center mb-8" aria-label="Progress">
      {steps.map((step, index) => (
        // We use Fragment to add the connecting line
        <Fragment key={step.name}>
          {/* Connecting Line (don't show before the first step) */}
          {index > 0 && (
            <div className={`flex-auto h-1 transition-colors ${
              index <= stageIndex ? 'bg-blue-500' : 'bg-gray-600'
            }`} />
          )}
          
          {/* Step Icon and Label */}
          <div className="relative flex flex-col items-center w-24">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                index < stageIndex
                  ? 'bg-green-500' // Completed
                  : index === stageIndex
                  ? 'bg-blue-500 ring-4 ring-blue-500/30' // Current
                  : 'bg-gray-700' // Upcoming
              }`}
            >
              {index < stageIndex ? (
                <CheckIcon className="w-7 h-7 text-white" />
              ) : (
                <step.icon className="w-7 h-7 text-white" />
              )}
            </div>
            <p className={`mt-2 text-sm font-medium ${
              index <= stageIndex ? 'text-white' : 'text-gray-400'
            }`}>
              {step.name}
            </p>
          </div>
        </Fragment>
      ))}
    </nav>
  );
};


/**
 * Main CoursePlayer Component
 */
export default function CoursePlayer({ 
  videoID, 
  modules, 
  courseTitle, 
  currentModuleIndex, 
  setCurrentModuleIndex 
}) {
  
  const { user } = useAuth(); // Gets the hardcoded user
  const [showModal, setShowModal] = useState(false);
  const [modalStage, setModalStage] = useState('quiz');
  const [modalData, setModalData] = useState(null); 
  const [modalError, setModalError] = useState('');
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('AI is working...');
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerError, setPlayerError] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [verificationQuestion, setVerificationQuestion] = useState('');
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [projectReview, setProjectReview] = useState(null);
  const playerInstanceRef = useRef(null);

  // (useEffect for YouTube API - Unchanged)
  useEffect(() => {
    if (!videoID) {
      setPlayerError("No video ID provided");
      return;
    }
    const onYouTubeIframeAPIReady = () => {
      console.log("✅ YouTube IFrame API ready!");
      if (playerInstanceRef.current) {
        try { playerInstanceRef.current.destroy(); } catch(e) {}
      }
      const newPlayer = new window.YT.Player('youtube-player-div', {
        height: '100%',
        width: '100%',
        videoId: videoID,
        playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: (event) => {
            console.log('✅ Player ready!');
            setPlayer(event.target);
            setPlayerError(null);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            else if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
            else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              if (!showModal && !isModalLoading) {
                  console.log(`Hit video END trigger! Opening modal.`);
                  setShowModal(true);
              }
            }
          },
          onError: (event) => {
            console.error('❌ YouTube player error:', event.data);
            setPlayerError(`Player Error: ${event.data}`);
          }
        }
      });
      playerInstanceRef.current = newPlayer;
    };
    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, [videoID]);

  // (useEffect for Gatekeeper timer - Unchanged)
  useEffect(() => {
    if (!player || !isPlaying) return;
    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        const time = player.getCurrentTime();
        setCurrentTime(time);
        const currentModule = modules[currentModuleIndex];
        if (time >= currentModule.endTime && !showModal && !isModalLoading) {
          console.log(`Hit gate for ${currentModule.name}! Pausing video.`);
          player.pauseVideo();
          setShowModal(true);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [player, isPlaying, currentModuleIndex, showModal, isModalLoading, modules]);

  // (useEffect for Modal open - Unchanged)
  useEffect(() => {
    if (showModal) {
      const currentModule = modules[currentModuleIndex];
      setIsModalLoading(false);
      setModalError('');
      setProjectReview(null);
      setVerificationQuestion('');
      setVerificationAnswer('');
      setGithubRepoUrl('');
      setQuizQuestions(currentModule.quizData || []);
      setCurrentQuizQuestion(0);
      setSelectedAnswer(null);
      if (currentModule.quizData && currentModule.quizData.length > 0) {
        setModalStage('quiz'); 
        setModalData(currentModule.quizData); 
      } else if (currentModule.projectBrief) {
        setModalStage('project'); 
        setModalData({ brief: currentModule.projectBrief }); 
      } else {
        handleModalSuccess();
      }
    }
  }, [showModal, currentModuleIndex, modules]);

  // (handleQuizAnswer - Unchanged)
  const handleQuizAnswer = (option) => {
    setSelectedAnswer(option);
  };

  /**
   * NEW: handleReplayModule Function
   * This closes the modal and seeks the video back to the
   * beginning of the current module.
   */
  const handleReplayModule = () => {
    if (!player) return;
    const currentModule = modules[currentModuleIndex];
    // Seek to the start time of the current module
    player.seekTo(currentModule.startTime, true);
    player.playVideo();
    setShowModal(false);
  };

  // (handleQuizSubmit - Unchanged)
  const handleQuizSubmit = () => {
    const quizQuestions = modalData; 
    const currentQuestion = quizQuestions[currentQuizQuestion];
    if (selectedAnswer === currentQuestion.answer) {
      setModalError('');
      setSelectedAnswer(null);
      if (currentQuizQuestion < quizQuestions.length - 1) {
        setCurrentQuizQuestion(currentQuizQuestion + 1);
      } else {
        console.log("✅ Quiz Passed!");
        const currentModule = modules[currentModuleIndex];
        if (currentModule.projectBrief) {
          setModalStage('project');
          setModalData({ brief: currentModule.projectBrief });
        } else {
          handleModalSuccess(); 
        }
      }
    } else {
      setModalError("That's not quite right. Try again!");
    }
  };

  // (handleProjectSubmit - Unchanged)
  const handleProjectSubmit = async () => {
    const currentModule = modules[currentModuleIndex];
    setIsModalLoading(true);
    setLoadingStatus("AI is reviewing your code..."); 
    setModalError('');
    try {
      const reviewRes = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          githubRepoUrl: githubRepoUrl, 
          projectBrief: currentModule.projectBrief 
        }),
      });
      const reviewData = await reviewRes.json();
      if (!reviewRes.ok) throw new Error(reviewData.error || 'Code review failed.');
      if (reviewData.solvesBrief === false) {
        throw new Error(reviewData.feedback || "Your project does not meet the brief's requirements.");
      }
      setProjectReview(reviewData); 
      setVerificationQuestion(reviewData.verificationQuestion);
      setModalStage('interview'); 
    } catch (err) {
      setModalError(err.message); 
    }
    setIsModalLoading(false);
  };
  
  // (handleInterviewSubmit - Unchanged)
  const handleInterviewSubmit = async () => {
    if (!user) {
      setModalError("Auth Error: User not found. Please refresh.");
      setIsModalLoading(false);
      return; 
    }
    const currentModule = modules[currentModuleIndex];
    setIsModalLoading(true);
    setModalError('');
    try {
      setLoadingStatus("Checking your answer..."); 
      const checkRes = await fetch('/api/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: verificationQuestion, 
          userAnswer: verificationAnswer 
        }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || 'AI check failed.');
      if (!checkData.isCorrect) {
        throw new Error("That answer wasn't quite right. Please try again.");
      }
      setLoadingStatus("Answer correct! Minting your 'Proof-of-Skill' NFT...");
      const mintRes = await fetch('/api/mint-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWalletAddress: user.walletAddress,
          projectName: currentModule.name,
          courseName: courseTitle
        })
      });
      const mintData = await mintRes.json();
      if (!mintData.success) {
        throw new Error(`NFT minting failed: ${mintData.error || 'Unknown reason'}`);
      }
      alert(`Success! NFT (ID: ${mintData.tokenId}) minted to your wallet!`);
      setLoadingStatus("NFT minted! Saving project to your profile...");
      const saveRes = await fetch('/api/save-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userWalletAddress: user.walletAddress,
          courseName: courseTitle,
          projectBrief: currentModule.projectBrief,
          aiFeedback: projectReview.feedback,
          skills: ["JavaScript", "HTML", "CSS"],
          transactionHash: mintData.transactionHash,
          tokenId: mintData.tokenId 
        })
      });
      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error("Failed to save your project to the database.");
      handleModalSuccess();
    } catch (err) {
      console.error(err);
      setModalError(err.message); 
    }
    setIsModalLoading(false);
  };
  
  // (handleModalSuccess - Unchanged)
  const handleModalSuccess = () => {
    console.log("Module passed! Unlocking next chapter.");
    setShowModal(false);
    setIsModalLoading(false);
    const nextIndex = currentModuleIndex + 1;
    if (nextIndex < modules.length) {
      setCurrentModuleIndex(nextIndex); 
      const nextModuleStartTime = modules[nextIndex].startTime;
      if (player && player.seekTo) {
        player.seekTo(nextModuleStartTime, true);
        player.playVideo();
      }
    } else {
      alert("Congratulations! You completed the course! Time to build your resume.");
    }
  };

  // (handlePlayPause - Unchanged)
  const handlePlayPause = () => {
    if (!player) return;
    try {
      if (isPlaying) player.pauseVideo();
      else player.playVideo();
    } catch (error) {
      console.error("Error controlling playback:", error);
    }
  };

  // --- JSX Below (Fully Updated) ---
  return (
    <div className="w-full">
      {/* Player (Unchanged) */}
      <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black relative">
        <div id="youtube-player-div" className="w-full h-full"></div>
        {playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 text-white p-8">
            <div className="text-center">
              <p className="text-xl font-bold mb-2">❌ Player Error</p>
              <p className="text-sm mb-4">{playerError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        )}
        {!player && !playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading YouTube player...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Player Controls (Unchanged) */}
      <div className="mt-4 space-y-3">
        <div className="flex justify-center gap-4">
          <button
            onClick={handlePlayPause}
            disabled={!player}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg text-sm">
          <p className="text-gray-300 mb-2"><strong>Status:</strong></p>
          <p className="text-gray-400">• Player loaded: {player ? '✅ Yes' : '❌ No'}</p>
          <p className="text-gray-400">• Playing: {isPlaying ? '▶️ Yes' : '⏸️ No'}</p>
          <p className="text-gray-400">• Current time: {Math.floor(currentTime)}s</p>
          <p className="text-gray-400">• Next checkpoint: {modules[currentModuleIndex].endTime}s</p>
        </div>
      </div>

      {/* --- The NEWLY STYLED Multi-Stage Modal --- */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={() => {}} // Prevents closing on backdrop click
        >
          <div 
            className="bg-gray-800 bg-opacity-70 backdrop-blur-lg border border-gray-700/50 w-full max-w-2xl m-4 p-8 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Modal Header */}
            <div className="mb-4 text-center">
              <h2 className="text-3xl font-bold text-white">Checkpoint!</h2>
              <p className="text-gray-300">
                You've reached the end of "{modules[currentModuleIndex].name}".
              </p>
            </div>

            {/* NEW: Conditional Stepper */}
            {/* This only shows if it's a multi-stage (project) module */}
            {modules[currentModuleIndex].projectBrief && (
              <ModalStepper stage={modalStage} />
            )}

            {/* Modal Content */}
            <div className="py-4 min-h-[200px] text-gray-200">
              {isModalLoading && (
                <div className="flex flex-col justify-center items-center h-24">
                  <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <p className="mt-4 text-gray-300">{loadingStatus}</p>
                </div>
              )}

              {modalError && !isModalLoading && (
                <p className="p-4 bg-red-900 text-white rounded-md mb-4">{modalError}</p>
              )}

              {/* --- STAGE 1: QUIZ --- */}
              {modalStage === 'quiz' && !isModalLoading && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-xl text-center mb-4 text-white">
                    <BeakerIcon className="w-6 h-6 inline-block mr-2 text-blue-400" />
                    Knowledge Check
                  </h3>
                  {modalData && modalData.length > 0 ? (
                    <>
                      <p className="text-gray-200 text-lg text-center">
                        Question {currentQuizQuestion + 1} of {modalData.length}:<br/>
                        <span className="font-semibold">{modalData[currentQuizQuestion].question}</span>
                      </p>
                      <div className="flex flex-col gap-3 mt-4">
                        {modalData[currentQuizQuestion].options.map((opt, i) => (
                          <button 
                            key={i} 
                            onClick={() => handleQuizAnswer(opt)}
                            className={`w-full p-4 text-left rounded-lg transition-all transform hover:scale-[1.02] ${
                              selectedAnswer === opt 
                                ? 'bg-blue-600 ring-2 ring-blue-400' 
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      
                      {/* NEW: Button container with Replay button */}
                      <div className="flex justify-between items-center pt-6 border-t border-gray-700 mt-6">
                        <button
                          onClick={handleReplayModule}
                          className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center"
                        >
                          <ArrowUturnLeftIcon className="w-5 h-5 mr-2" />
                          Replay Chapter
                        </button>
                        <button
                          onClick={handleQuizSubmit}
                          disabled={!selectedAnswer}
                          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          Submit Answer
                        </button>
                      </div>
                    </>
                  ) : (
                    <p>Error: No quiz data found for this module.</p>
                  )}
                </div>
              )}

              {/* --- STAGE 2: PROJECT --- */}
              {modalStage === 'project' && !isModalLoading && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-xl text-center mb-4 text-white">
                    <CodeBracketIcon className="w-6 h-6 inline-block mr-2 text-blue-400" />
                    Project Submission
                  </h3>
                  <p className="text-center text-lg">{modalData?.brief}</p>
                  
                  <label htmlFor="githubRepoUrl" className="block text-sm font-medium mb-1 mt-4 text-gray-300">Submit your GitHub Repo URL:</label>
                  <input
                    type="text"
                    id="githubRepoUrl"
                    value={githubRepoUrl}
                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                    placeholder="https://github.com/your-name/repo/tree/main/folder"
                    className="w-full p-3 rounded bg-gray-900/80 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleProjectSubmit}
                    disabled={isModalLoading}
                    className="px-6 py-3 mt-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600"
                  >
                    Submit for AI Review
                  </button>
                </div>
              )}

              {/* --- STAGE 3: INTERVIEW --- */}
              {modalStage === 'interview' && !isModalLoading && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-xl text-center mb-4 text-white">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 inline-block mr-2 text-blue-400" />
                    AI Verification
                  </h3>
                  <p className="text-gray-300 text-center text-lg">Your code has been reviewed (Score: {projectReview?.qualityScore}/10). To prove you wrote it, please answer this question:</p>
                  <p className="p-4 bg-gray-900/80 rounded-md italic text-center text-white">"{verificationQuestion}"</p>
                  
                  <label htmlFor="verificationAnswer" className="block text-sm font-medium mb-1 mt-4 text-gray-300">Your Answer:</label>
                  <textarea
                    id="verificationAnswer"
                    value={verificationAnswer}
                    onChange={(e) => setVerificationAnswer(e.target.value)}
                    className="w-full p-3 rounded bg-gray-900/80 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  <button
                    onClick={handleInterviewSubmit}
                    disabled={isModalLoading}
                    className="px-6 py-3 mt-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors disabled:bg-gray-600"
                  >
                    Submit & Claim Certificate
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}