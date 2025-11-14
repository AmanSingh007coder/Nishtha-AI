// app/api/generate-resume/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User'; // Import our User model
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// This is the "Super-Prompt" for your AI Career Coach
const resumePrompt = `
  You are a professional career coach and expert resume writer.
  A developer has provided you with their user data and a list of AI-VERIFIED projects they have completed on our platform.
  
  Your task is to generate a complete, professional resume in the standard "JSON Resume" format.

  RULES:
  1.  Generate a powerful, professional "summary" based on their skills.
  2.  List *all* their verified projects under the "projects" section.
  3.  For each project, use the "projectBrief" as the name and the "aiFeedback" as a description.
  4.  Aggregate all unique "skills" from their projects into the main "skills" section.
  5.  The output MUST be *only* a valid JSON object. Do not add "json" or backticks.

  HERE IS THE USER'S DATA:
`;

export async function POST(request) {
  const body = await request.json();
  const { userEmail } = body;

  if (!userEmail) {
    return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
  }

  try {
    // 1. Connect to the database
    await dbConnect();

    // 2. Find the user and their projects
    const user = await User.findOne({ email: userEmail });

    if (!user || !user.verifiedProjects || user.verifiedProjects.length === 0) {
      return NextResponse.json({ error: 'No verified projects found for this user.' }, { status: 404 });
    }

    // 3. Build the prompt for the AI
    const userData = {
      basics: {
        email: user.email,
        name: "Verified Developer" // Placeholder name
      },
      projects: user.verifiedProjects.map(p => ({
        name: p.projectBrief,
        description: `(AI-Verified): ${p.aiFeedback}`,
        keywords: p.skills
      })),
      skills: [...new Set(user.verifiedProjects.flatMap(p => p.skills))] // Creates a unique list of skills
    };
    
    const fullPrompt = `${resumePrompt} \n ${JSON.stringify(userData, null, 2)}`;
    
    // 4. Call the AI
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      safetySettings: [ /* ... (your safety settings) ... */ ],
      contents: [{ parts: [{ text: fullPrompt }] }]
    });

    const aiResponseText = response.text.replace(/```json|```/g, '').trim();
    const aiJSON = JSON.parse(aiResponseText);
    
    // 5. Send back the complete JSON Resume
    return NextResponse.json(aiJSON);

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: `Failed to generate resume: ${error.message}` }, { status: 500 });
  }
}