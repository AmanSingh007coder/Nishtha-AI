// app/api/generate-course-plan/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course'; 
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// This helper function extracts the video ID from any YouTube URL
function extractVideoID(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1); // For youtu.be/VIDEO_ID
    }
    return urlObj.searchParams.get('v'); // For youtube.com/watch?v=VIDEO_ID
  } catch (e) {
    console.error("Invalid URL", e);
    return null;
  }
}

// THIS IS THE "SUPER-PROMPT" FOR YOUR PROMPT ENGINEER TEAMMATE
const coursePlannerPrompt = `
  You are an expert curriculum designer. I am providing you with a YouTube video transcript.
  Your job is to analyze this transcript and divide it into 3-5 logical "Modules".

  RULES:
  1.  You must **IGNORE ALL 'fluff'** (like 'like and subscribe', sponsor messages, intros, and off-topic stories).
  2.  You must understand "Hinglish" (Hindi/English mix) but your output must be 100% English.
  3.  For *each* module, you must provide:
      a) A "name" (e.g., "Module 1: Express Setup & Routes").
      b) The "startTime" (in seconds) and "endTime" (in seconds) of that module.
      c) A "quizData" array with 3 multiple-choice questions based *only* on that module's content. Each question must have "question", "options" (an array), and "answer" (the correct string from the options).
      d) A "projectBrief" string. 
          - If the module is short (under 10 minutes), this can be null.
          - If the module is long (over 10 minutes), this should be a 2-3 sentence "Mini-Capstone" project brief.

  You must respond ONLY with a single, valid JSON object in this format: 
  { 
    "courseTitle": "A good title for the course",
    "modules": [ 
      {
        "name": "...", 
        "startTime": 0, 
        "endTime": 600, 
        "quizData": [ ...quiz questions... ], 
        "projectBrief": "Build a small project..." 
      },
      {
        "name": "...", 
        "startTime": 600, 
        "endTime": 1200, 
        "quizData": [ ...quiz questions... ], 
        "projectBrief": null
      }
    ] 
  }
  Do not write any other text or markdown.
`;

export async function POST(request) {
  const body = await request.json();
  const { videoURL } = body; 

  const videoID = extractVideoID(videoURL);
  
  if (!videoURL || !videoID) {
    return NextResponse.json({ error: 'A valid YouTube URL is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 1. CHECK CACHE:
    let course = await Course.findOne({ videoURL: videoURL });
    if (course) {
      console.log("Found course in cache (MongoDB)!");
      return NextResponse.json(course); 
    }

    // 2. If not in cache, call the AI
    console.log("Not in cache. Calling Gemini 2.5 Flash...");
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      contents: [
        { parts: [
            { fileData: { mimeType: 'video/youtube', fileUri: videoURL } },
            { text: coursePlannerPrompt }
        ]}
      ]
    });

    const aiResponseText = response.text.replace(/```json|```/g, '').trim();
    const aiJSON = JSON.parse(aiResponseText); // This is { "modules": [...], "courseTitle": "..." }
    
    // 3. Save the new plan to our MongoDB cache
    console.log("Saving new course plan to MongoDB...");
    course = new Course({
      videoURL: videoURL,
      videoID: videoID, // We save the ID
      courseTitle: aiJSON.courseTitle || "AI Generated Course", // Get the title from the AI
      modules: aiJSON.modules // Save the modules array from the AI
    });
    await course.save();
    
    // 4. Send the *full new course object* back to the frontend
    return NextResponse.json(course);

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: `Failed to generate course plan: ${error.message}` }, { status: 500 });
  }
}