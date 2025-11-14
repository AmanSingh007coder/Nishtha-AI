// app/api/generate-resume/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// This is the "Super-Prompt" for your AI Career Coach
const resumePrompt = `
  You are a professional career coach and expert resume writer.
  A developer has provided you with their user data and a list of AI-VERIFIED projects.
  
  Your task is to generate a complete, professional resume in the standard "JSON Resume" format.

  RULES:
  1.  Generate a powerful, professional "summary" based on their skills.
  2.  List *all* their verified projects under the "projects" section.
  3.  For each project, use the "courseName" as the "name", "projectBrief" as the "summary", and a list of "highlights".
  4.  The "highlights" array MUST include the "aiFeedback" and the "transactionHash".
  5.  Aggregate all unique "skills" into the "skills" section.
  6.  The "skills" section MUST be an array of objects, like this:
      { "name": "AI-Verified Skills", "level": "Proficient", "keywords": ["React", "Node.js", "MongoDB", "Blockchain"] }

  The output MUST be *only* a valid JSON object. Do not add "json" or "markdown" backticks.

  HERE IS THE USER'S DATA:
`;

export async function POST(request) {
  const body = await request.json();
  const { userEmail } = body;

  if (!userEmail) {
    return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
  }

  try {
    await dbConnect();
    const user = await User.findOne({ email: userEmail });

    if (!user || !user.verifiedProjects || user.verifiedProjects.length === 0) {
      return NextResponse.json({ error: 'No verified projects found for this user.' }, { status: 404 });
    }

    // This is the "robust" data mapping
    const userData = {
      basics: {
        email: user.email,
        name: "Nishtha AI Verified Developer"
      },
      projects: user.verifiedProjects.map(p => {
        const highlights = [];
        if (p.aiFeedback) {
          highlights.push(`(AI-Verified): ${p.aiFeedback}`);
        }
        if (p.transactionHash) {
          highlights.push(`View Proof: https://sepolia.etherscan.io/tx/${p.transactionHash}`);
        }
        return {
          name: p.courseName || "Verified Project",
          summary: p.projectBrief || "Completed a verified project.",
          highlights: highlights,
          keywords: p.skills || ["Verified Skill"]
        };
      }),
      skills: [
        {
          name: "AI-Verified Skills",
          level: "Proficient",
          keywords: [...new Set(user.verifiedProjects.flatMap(p => p.skills || []))]
        }
      ]
    };
    
    const fullPrompt = `${resumePrompt} \n ${JSON.stringify(userData, null, 2)}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    return NextResponse.json({ error: `Failed to generate resume: ${error.message}` }, { status: 500 });
  }
}