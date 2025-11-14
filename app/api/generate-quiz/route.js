// app/api/generate-quiz/route.js
import { NextResponse } from 'next/server';
// 1. Import from the NEW library
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// 2. Initialize with the NEW syntax
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const superPrompt = `
  You are an expert technical educator. I am providing you with a YouTube video.
  Your job is to do two things:
  
  1.  First, accurately transcribe the *entire* video. The audio may be in "Hinglish" or contain "fluff" (like 'like and subscribe').
  2.  Second, after you have the full transcript, you must **IGNORE all fluff** and focus *only* on the core technical concepts.
  
  Based *only* on those technical concepts, generate a 5-question multiple-choice quiz.
  Return your response as a single, valid JSON object.
  
  The JSON format MUST be:
  {
    "fullTranscript": "The full, word-for-word transcript of the video...",
    "quiz": [
      {
        "question": "What is the purpose of the useEffect hook?",
        "options": ["To fetch data", "To manage state", "To style components", "All of the above"],
        "answer": "All of the above"
      },
      { "question": "...", "options": [...], "answer": "..." }
    ]
  }
`;

export async function POST(request) {
  const body = await request.json();
  const { videoURL } = body;

  if (!videoURL) {
    return NextResponse.json({ error: 'videoURL is required' }, { status: 400 });
  }

  try {
    // --- THIS IS THE CORRECTED CODE ---
    // We call ai.models.generateContent directly
    // We use 'gemini-1.5-flash' which is the stable 1M token model.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      contents: [
        {
          parts: [
            { fileData: { mimeType: 'video/youtube', fileUri: videoURL } },
            { text: superPrompt }
          ]
        }
      ]
    });
    // --- END OF CORRECTED CODE ---
    
    // The AI's response will be the JSON string
    // We use response.text (a property), NOT response.text() (a method)
    const aiResponseText = response.text.replace(/```json|```/g, '').trim();
    const aiJSON = JSON.parse(aiResponseText);
    
    return NextResponse.json(aiJSON);

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: `Failed to process video: ${error.message}` }, { status: 500 });
  }
}