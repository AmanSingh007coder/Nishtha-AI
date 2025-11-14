// app/api/check-answer/route.js
import { NextResponse } from 'next/server';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// This is a simple, very focused "Super-Prompt"
const checkerPrompt = `
  You are an "AI Grader." Your job is to determine if a user's answer correctly answers a specific question.
  The [QUESTION] was:
  "In your code, the app.listen() call currently only specifies the port. What is the common practice for the second argument to app.listen() and why is it useful?"

  The [USER'S ANSWER] was:
  "It's for a callback function. It's useful so you can console.log that the server has started."

  Based on this, is the user's answer conceptually correct?
  Respond ONLY with a single JSON object in the format: {"isCorrect": boolean}
`;

export async function POST(request) {
  const body = await request.json();
  const { question, userAnswer } = body;

  if (!question || !userAnswer) {
    return NextResponse.json({ error: 'Question and Answer are required' }, { status: 400 });
  }

  try {
    // We build the prompt for the AI
    const fullPrompt = `
      You are an "AI Grader." Your job is to determine if a user's answer correctly answers a specific question.
      The [QUESTION] was:
      "${question}"

      The [USER'S ANSWER] was:
      "${userAnswer}"

      Based on this, is the user's answer conceptually correct?
      Respond ONLY with a single JSON object in the format: {"isCorrect": boolean}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      contents: [{ parts: [{ text: fullPrompt }] }]
    });

    const aiResponseText = response.text.replace(/```json|```/g, '').trim();
    const aiJSON = JSON.parse(aiResponseText);
    
    return NextResponse.json(aiJSON);

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: `Failed to check answer: ${error.message}` }, { status: 500 });
  }
}