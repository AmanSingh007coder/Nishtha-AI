import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course';
// 1. Use the modern, correct SDK
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
// 2. Use the 'youtube-transcript' library
import { YoutubeTranscript } from 'youtube-transcript'; 

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

// 3. This is the robust prompt that uses timestamps
// and only asks for projects on long modules.
const coursePlannerPrompt = `
  You are an expert curriculum designer. I am providing you with a full YouTube video transcript.
  The transcript is formatted with (Time: Xm Ys) markers.

  YOUR JOB:
  1.  Analyze this transcript and divide it into 3-5 logical "Modules".
  2.  You MUST use the (Time: Xm Ys) markers to determine the "startTime" and "endTime" for each module.
  3.  You must return these times in *total seconds*. For example, (Time: 2m 30s) would be a startTime of 150.
  4.  You must **IGNORE ALL 'fluff'** (like 'like and subscribe', sponsor messages, intros, and off-topic stories).

  RULES FOR *EACH* MODULE:
  
  5.  **QUIZ RULE:** The 3 questions in 'quizData' MUST be answerable *only* by using the transcript content *between* that module's specific 'startTime' and 'endTime'. The questions must be about the specific code or concepts taught *in that section*, not general knowledge.

  6.  **PROJECT RULE:** The 'projectBrief' MUST be 'null' if the module's duration (endTime - startTime) is less than 600 seconds (10 minutes). Do not assign projects for short modules. If the module is over 10 minutes, write a 2-3 sentence "Mini-Capstone" project brief.

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

  	// 2. FETCH TRANSCRIPT with TIMESTAMPS (No chunking)
  	console.log("Fetching transcript...");
    let transcriptArray;
    try {
	  // Use the library to get timestamped data
	  transcriptArray = await YoutubeTranscript.fetchTranscript(videoID);
    } catch (transcriptError) {
      console.error("!!! YouTubeTranscript Library Error:", transcriptError.message);
      return NextResponse.json({ 
        error: `Failed to fetch transcript: ${transcriptError.message}`,
        details: "This often means the video has no captions or is private."
      }, { status: 404 });
    }

    // 3. CRITICAL CHECK for empty transcript
	if (!transcriptArray || transcriptArray.length === 0) {
	  console.error("!!! Transcript is empty. Video likely has no captions.");
  	  return NextResponse.json({ error: 'Could not fetch transcript for this video. It may have captions disabled.' }, { status: 404 });
	}

    // 4. Format transcript into ONE string
  	const fullTranscript = transcriptArray
  	  .map(item => {
		const totalSeconds = Math.floor(item.offset); 
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
        // This is the "safe" format that won't be mistaken for an image
		return `(Time: ${minutes}m ${seconds}s) ${item.text}`;
	  })
  	  .join("\n");

  	console.log("Transcript fetched. Length:", fullTranscript.length);

  	// 5. CALL AI with the correct model
  	console.log("Calling Gemini with transcript...");

  	const response = await ai.models.generateContent({
  	  // Use the 1M token model that can handle the full text
  	  model: 'gemini-1.5-pro-latest',
  	  safetySettings: [
  		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  		{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  		{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  		{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  	  ],
  	  contents: [
  		{
  		  parts: [
  			{ text: "Here is the transcript:\n\n" + fullTranscript },
  			{ text: coursePlannerPrompt }
  		  ]
  		}
  	  ]
  	});

    // 6. Fix the regex typo from your file
  	aiResponseText = response.text.replace(/```json|```/g, '').trim();
    NextResponse.json()  
	  const aiJSON = JSON.parse(aiResponseText);
  	// 7. SAVE TO DB (CACHE)
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
	  console.error(aiResponseText); // Log the bad response
	  console.error("---------------------------------");
	  return NextResponse.json({ error: 'AI returned an invalid response. The prompt may be failing.', details: aiResponseText }, { status: 500 });
	}
  	return NextResponse.json(
  	  { error: `Failed: ${error.message}` },
  	  { status: 500 }
  	);
  }
}