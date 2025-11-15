// app/api/verify-code/route.js
import { NextResponse } from 'next/server';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- (GitHub parsing functions are the same as before) ---
function parseGitHubUrl(url) {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split('/');
    if (parts.length < 3) throw new Error('Invalid GitHub URL');
    
    const owner = parts[1];
    const repo = parts[2];
    
    let branch = 'main'; // Default to 'main'
    let path = '';

    if (parts.length > 4 && parts[3] === 'tree') {
      branch = parts[4]; 
      path = parts.slice(5).join('/'); 
    }
    return { owner, repo, branch, path };
  } catch (error) {
    console.error('Failed to parse URL:', error.message);
    throw new Error('Invalid GitHub URL format.');
  }
}

async function fetchRepoContents(owner, repo, branch, path) { 
  let allCode = '';
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeResponse = await fetch(treeUrl);

  if (!treeResponse.ok) {
    throw new Error(`Failed to fetch repo tree. Status: ${treeResponse.status}. Check owner, repo, or branch name.`);
  }

  const treeData = await treeResponse.json();
  const filesToFetch = treeData.tree.filter(file => 
    file.type === 'blob' && 
    file.path.startsWith(path) && 
    !file.path.includes('node_modules') 
  );

  if (filesToFetch.length === 0) {
    throw new Error('No valid code files (.js, .html, .css) found in the specified path.');
  }

  for (const file of filesToFetch) {
    const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
    const fileResponse = await fetch(fileUrl);
    const fileContent = await fileResponse.text();
    allCode += `\n\n--- FILE: ${file.path} ---\n\n${fileContent}`;
  }
  return allCode;
}
// --- (End of GitHub parsing functions) ---


// --- THIS IS THE NEW, STRICTER "SUPER-PROMPT" ---
const techLeadPrompt = `
Now as a senior Tech lead from google who is strict but fair, Analyse the github repo url( the project is based on the project you have given) and give feedback based on your analysis.Give suggestions on where the mistakes are, which are the regions where the user can improve,what would have been a better/simpler approch based on the slice of a code,etc. Also ensure that the suggestions/better approach is within the topics the user has completed. Also if the project is not same as what you had given then return a error message. Return a JSON object with 4 fields: solvesBrief (boolean), qualityScore (number 1-10), feedback (a short, constructive string), and verificationQuestion (a single conceptual question about their code to prove they understand it). Respond ONLY with the raw JSON object.
`;
// --- END OF NEW PROMPT ---


export async function POST(request) {
  const body = await request.json();
  const { githubRepoUrl, projectBrief } = body;

  if (!githubRepoUrl || !projectBrief) {
    return NextResponse.json({ error: 'Repo URL and Brief are required' }, { status: 400 });
  }

  let userCode = '';
  let aiJSON;

  try {
    const { owner, repo, branch, path } = parseGitHubUrl(githubRepoUrl);
    userCode = await fetchRepoContents(owner, repo, branch, path);

    const fullPrompt = `
      [PROJECT BRIEF]
      ${projectBrief}

      [USER'S CODE]
      ${userCode}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      contents: [{ parts: [{ text: techLeadPrompt }, { text: fullPrompt }] }]
    });
    
    const aiResponseText = response.text.replace(/```json|```/g, '').trim();
    aiJSON = JSON.parse(aiResponseText);
    
    return NextResponse.json(aiJSON);

  } catch (error) {
    console.error("Full Error:", error);
    return NextResponse.json({ error: `Verification failed: ${error.message}` }, { status: 500 });
  }
}