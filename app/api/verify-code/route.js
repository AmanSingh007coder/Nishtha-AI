// app/api/verify-code/route.js
import { NextResponse } from 'next/server';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- (This is our NEW, SMARTER GitHub parser) ---

/**
 * Parses a GitHub URL to get the owner, repo, branch, and path.
 * e.g., "https://github.com/user/repo/tree/master/src/project-1"
 * returns { owner: 'user', repo: 'repo', branch: 'master', path: 'src/project-1' }
 */
function parseGitHubUrl(url) {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split('/');
    // parts = ["", "user", "repo", "tree", "branch", "path..."]
    
    if (parts.length < 3) throw new Error('Invalid GitHub URL');
    
    const owner = parts[1];
    const repo = parts[2];
    
    let branch = 'main'; // Default to 'main'
    let path = '';

    // Check if it's a folder path (has "tree/branch")
    if (parts.length > 4 && parts[3] === 'tree') {
      branch = parts[4]; // <-- THIS IS THE FIX: We get the branch name
      path = parts.slice(5).join('/'); // Get everything *after* the branch
    }

    return { owner, repo, branch, path }; // <-- THIS IS THE FIX: We return the branch
  } catch (error) {
    console.error('Failed to parse URL:', error.message);
    throw new Error('Invalid GitHub URL format.');
  }
}

/**
 * Fetches all file contents from a GitHub repo folder as a single string.
 */
// It now accepts the 'branch' as an argument
async function fetchRepoContents(owner, repo, branch, path) { 
  let allCode = '';
  
  // 1. Get the list of all files
  // THIS IS THE FIX: We use the 'branch' variable instead of hard-coding 'main'
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeResponse = await fetch(treeUrl);

  if (!treeResponse.ok) {
    // This error message is now more helpful
    throw new Error(`Failed to fetch repo tree. Status: ${treeResponse.status}. Check owner, repo, or branch name.`);
  }

  const treeData = await treeResponse.json();
  
  // 2. Filter *only* the files that are inside our target 'path'
  const filesToFetch = treeData.tree.filter(file => 
    file.type === 'blob' && // 'blob' means file, not folder
    file.path.startsWith(path) && // It's in our project-1 folder
    !file.path.includes('node_modules') && // Ignore node_modules
    (file.path.endsWith('.js') || file.path.endsWith('.jsx') || file.path.endsWith('.json') || file.path.endsWith('package.json') || (file.path.endsWith('.ts') || file.path.endsWith('.html') || file.path.endsWith('.css'))) // Get all web files
  );

  if (filesToFetch.length === 0) {
    throw new Error('No code files found in the specified path. Check your URL or folder name.');
  }

  // 3. Fetch the raw text for each of those files
  for (const file of filesToFetch) {
    // THIS IS THE FIX: We also use the 'branch' variable here
    const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
    const fileResponse = await fetch(fileUrl);
    const fileContent = await fileResponse.text();
    
    // We combine all files into one giant string
    allCode += `\n\n--- FILE: ${file.path} ---\n\n${fileContent}`;
  }

  return allCode;
}

// --- (This is our "Super-Prompt" from before) ---
const techLeadPrompt = `
  You are a "Senior Tech Lead" at Google. You are strict, fair, and your goal is to help a junior developer improve.
  I am providing you with two things:
  1.  The [PROJECT BRIEF] they were given.
  2.  The [USER'S CODE] as a single block of text, with each file clearly marked.

  Your job is to analyze the code against the brief and return a JSON object with 4 specific fields:
  
  1.  "solvesBrief" (boolean): Did the user's code successfully accomplish the main goals of the brief?
  2.  "qualityScore" (number, 1-10): How is the code quality, readability, and use of best practices? (Be strict).
  3.  "feedback" (string): A short, constructive, and actionable piece of feedback for the developer.
  4.  "verificationQuestion" (string): A *single*, targeted, conceptual question about the user's *own code* to prove they understand it. (e.g., "In your 'Cart.js' file, why was it important to use 'useEffect' for the price calculation?").
  
  Respond ONLY with the raw JSON object.
`;

// --- (This is our main API function, now upgraded) ---
export async function POST(request) {
  const body = await request.json();
  const { githubRepoUrl, projectBrief } = body;

  if (!githubRepoUrl || !projectBrief) {
    return NextResponse.json({ error: 'Repo URL and Brief are required' }, { status: 400 });
  }

  let userCode = '';
  let aiJSON;

  try {
    // 1. Parse the URL (now gets the 'branch')
    const { owner, repo, branch, path } = parseGitHubUrl(githubRepoUrl);

    // 2. Fetch the *REAL* code (now passes the 'branch')
    userCode = await fetchRepoContents(owner, repo, branch, path);

    // 3. Build the full prompt for the AI
    const fullPrompt = `
      ${techLeadPrompt} 

      [PROJECT BRIEF]
      ${projectBrief}

      [USER'S CODE]
      ${userCode}
    `;

    // 4. Call the AI
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
    aiJSON = JSON.parse(aiResponseText);
    
    // 5. Send the successful review back
    return NextResponse.json(aiJSON);

  } catch (error) {
    console.error("Full Error:", error);
    // This will send *any* error (from GitHub or AI) back to the frontend
    return NextResponse.json({ error: `Verification failed: ${error.message}` }, { status: 500 });
  }
}