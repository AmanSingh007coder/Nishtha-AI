import { NextResponse } from 'next/server';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { YouTubeTranscript } from 'youtube-transcript'; // We need this here now

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// This is a new, focused prompt for this API
const quizzerPrompt = `
  You are an expert quiz creator. I am providing you with a short transcript
  from a specific module of a video course.

  Based ONLY on the "MODULE TRANSCRIPT" below, generate an array of 3
  multiple-choice questions.
  
  - Questions must be about specific concepts from the text.
  - Do not ask generic questions.
  - The "options" array must have 4 items.

  Respond ONLY with a single, valid JSON object in this format:
  {
    "quiz": [
      {
        "question": "What is the purpose of the useEffect hook?",
        "options": ["To fetch data", "To manage state", "To style components", "All of the above"],
        "answer": "All of the above"
      },
      { "question": "...", "options": [...], "answer": "..." }
    ]
  }

  MODULE TRANSCRIPT:
`;

export async function POST(request) {
  const body = await request.json();
  // 1. We now expect startTime and endTime from the frontend
  const { videoURL, startTime, endTime } = body;

  if (!videoURL || startTime === undefined || endTime === undefined) {
    return NextResponse.json({ error: 'videoURL, startTime, and endTime are required' }, { status: 400 });
  }

  let aiResponseText; // For debugging

  try {
    // 2. Fetch the FULL transcript
    console.log(`Quizzer: Fetching transcript for ${videoURL}`);
    const fullTranscript = await YouTubeTranscript.fetchTranscript(videoURL);

    if (!fullTranscript || fullTranscript.length === 0) {
      return NextResponse.json({ error: 'Could not fetch transcript' }, { status: 404 });
    }

    // 3. "Slice" the transcript to get ONLY this module's text
    const moduleTranscript = fullTranscript
      .filter(item => item.offset >= startTime && item.offset <= endTime)
      .map(item => item.text)
      .join(' ');
    
    if (moduleTranscript.length === 0) {
      return NextResponse.json({ error: 'No transcript text found for this time range.' }, { status: 400 });
    }

    console.log(`Quizzer: Sliced transcript. Length: ${moduleTranscript.length}. Calling Flash model.`);

    // 4. Create the final prompt
    const finalPrompt = `${quizzerPrompt}\n${moduleTranscript}`;

    // 5. Call the FAST model (gemini-1.5-flash)
  	const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      contents: [
        { parts: [ { text: finalPrompt } ] }
      ]
  	});
    
  	aiResponseText = response.text.replace(/```json|```/g, '').trim();
  	const aiJSON = JSON.parse(aiResponseText);
  	
    // 6. Return the quiz data
  	return NextResponse.json(aiJSON); // This will be { "quiz": [...] }

  } catch (error) {
    console.error("AI Error:", error);
    if (error.name === 'SyntaxError') {
	  console.error("--- AI FAILED TO RETURN JSON ---", aiResponseText);
	  return NextResponse.json({ error: 'Quizzer AI failed to return valid JSON.', details: aiResponseText }, { status: 500 });
	}
    return NextResponse.json({ error: `Failed to process video: ${error.message}` }, { status: 500 });
  }
}