import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course';
// We are using the standard Google AI SDK
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// Initialize the AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* Extract YouTube video ID (Unchanged) */
function extractVideoID(url) {
  try {
  	const urlObj = new URL(url);
  	if (urlObj.hostname === 'youtu.be') {
  	  return urlObj.pathname.slice(1);
  	}
  	return urlObj.searchParams.get('v');
  } catch (e) {
  	console.error("Invalid URL", e);
  	return null;
  }
}

// This is the strict, single-call prompt for short videos.
const coursePlannerPrompt = `
You are an expert curriculum designer. I am providing you with a full YouTube video transcript (approx. 1 hour).
Your job is to analyze the video's content and structure it into a 6-module, gated learning path.

**CRITICAL RULES:**
1.  **Strict Adherence:** The final JSON MUST contain **EXACTLY 6** module objects.
2.  **Hinglish Filter:** You must accurately understand the content, regardless of mixed languages (Hinglish), but all output must be in clear English.
3.  **Fluff Filter:** IGNORE ALL 'fluff' (intros, 'like and subscribe', sponsor messages, etc.).
4.  **Sequential EndTimes:** EndTime of Module N MUST be the StartTime of Module N+1.

**MODULE DESIGN (Structure by Type):**
- **Module 1 (Quiz):** Covers setup, variables, and basic data types.
- **Module 2 (Quiz):** Covers operators and control flow (if/else).
- **Module 3 (Project):** A small project/checkpoint covering Modules 1 & 2.
- **Module 4 (Quiz):** Covers functions, arrays, and objects.
- **Module 5 (Project):** The final capstone project covering ALL concepts from Modules 1 through 4.
- **Module 6 (Complete):** The final, empty module marking the course end.

**RULES FOR FIELDS:**
- **For 'quiz' modules:** 'quizData' MUST contain 3 questions (with options and an answer). 'projectBrief' MUST be **null**.
- **For 'project' modules:** 'quizData' MUST be an empty array **[]**. 'projectBrief' MUST be a 2-3 sentence project idea based on the completed concepts.
- **For Module 6:** 'quizData' MUST be **[]** and 'projectBrief' MUST be **null**.

You must estimate the start and end times in seconds (e.g., 900 seconds for 15:00) based on the video length.

You must respond ONLY with a single, valid JSON object in this format: 
{ 
  "courseTitle": "A professional title derived from the video topic",
  "modules": [ 
    { "name": "Module 1: [Concept]", "startTime": 0, "endTime": 900, "type": "quiz", "quizData": [ ... ], "projectBrief": null },
    { "name": "Module 2: [Concept]", "startTime": 900, "endTime": 1800, "type": "quiz", "quizData": [ ... ], "projectBrief": null },
    { "name": "Module 3: Project Checkpoint", "startTime": 1800, "endTime": 1801, "type": "project", "quizData": [], "projectBrief": "Build a small web page demonstrating..." },
    { "name": "Module 4: [Concept]", "startTime": 1801, "endTime": 2700, "type": "quiz", "quizData": [ ... ], "projectBrief": null },
    { "name": "Module 5: Final Capstone Project", "startTime": 2700, "endTime": 2701, "type": "project", "quizData": [], "projectBrief": "Build a comprehensive application using ALL concepts, including DOM manipulation..." },
    { "name": "Course Complete", "startTime": 2701, "endTime": 3600, "type": "complete", "quizData": [], "projectBrief": null }
  ] 
}
Do not write any other text or markdown backticks.
`;

export async function POST(request) {
  const body = await request.json();
  const { videoURL } = body;

  const videoID = extractVideoID(videoURL);

  if (!videoURL || !videoID) {
  	return NextResponse.json(
  	  { error: 'A valid YouTube URL is required' },
  	  { status: 400 }
  	);
  }

  let aiResponseText; // Define here for access in the catch block

   try {
  	await dbConnect();

  	// 1. Check cache
  	let course = await Course.findOne({ videoURL });
  	if (course) {
  	  console.log("Found course in cache!");
  	  return NextResponse.json(course);
  	}

  	// 2. CALL AI WITH THE VIDEO FILE API
  	console.log("Not in cache. Calling Gemini with video file...");

  	const response = await ai.models.generateContent({
  	  // We use the fast 'flash' model
  	  model: 'gemini-2.0-flash', 
  	  safetySettings: [
  		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  		{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  		{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  	  ],
  	  contents: [
  		{
  		  parts: [
            // This is the "short video" method
  			{ fileData: { mimeType: 'video/youtube', fileUri: videoURL } },
  			{ text: coursePlannerPrompt }
  		  ]
  		}
  	  ]
  	});

    // 3. PARSE RESPONSE
  	aiResponseText = response.text.replace(/```json|```/g, '').trim();
  	const aiJSON = JSON.parse(aiResponseText);

  	// 4. SAVE TO DB (CACHE)
  	course = new Course({
  	  videoURL,
  	  videoID,
  	  courseTitle: aiJSON.courseTitle || "AI Generated Course",
  	  modules: aiJSON.modules
  	});

  	await course.save();

  	return NextResponse.json(course);

  } catch (error) {
  	console.error("ERROR:", error);
    // Add specific catch for JSON.parse failure
	if (error.name === 'SyntaxError') {
	  console.error("--- AI FAILED TO RETURN JSON ---");
	  console.error("--- AI Response was: ---");
	  console.error(aiResponseText);
	  console.error("---------------------------------");
	  return NextResponse.json({ error: 'AI returned an invalid response.', details: aiResponseText }, { status: 500 });
	}
    // This will catch the error if the video is too long
  	return NextResponse.json(
  	  { error: `Failed: ${error.message}` },
  	  { status: 500 }
  	);
  }
}