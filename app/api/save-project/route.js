// app/api/save-project/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User'; // Import our User model

export async function POST(request) {
  const body = await request.json();
  
  // --- THIS IS THE FIX ---
  // We now expect the blockchain data (txHash and tokenID)
  const { 
    userEmail, 
    courseName, 
    projectBrief, 
    aiFeedback, 
    skills,
    transactionHash, // <-- NEW
    tokenId          // <-- NEW
  } = body;
  // --- END OF FIX ---

  if (!userEmail || !projectBrief || !skills) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // 1. Connect to the database
    await dbConnect();

    // 2. Create the new "Building Block"
    const newVerifiedProject = {
      courseName: courseName,
      projectBrief: projectBrief,
      aiFeedback: aiFeedback,
      skills: skills,
      // --- THIS IS THE FIX ---
      // We save the blockchain proof to the database
      transactionHash: transactionHash,
      tokenId: tokenId,
      // --- END OF FIX ---
    };

    // 3. Find the user and push this new project into their array
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { 
        $push: { verifiedProjects: newVerifiedProject },
        $set: { email: userEmail, walletAddress: body.userWalletAddress } // Also save/update wallet address
      },
      { new: true, upsert: true } // 'new: true' returns the updated doc
    );

    // 4. Send back a success message
    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: `Failed to save project: ${error.message}` }, { status: 500 });
  }
}