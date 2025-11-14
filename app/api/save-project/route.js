// app/api/save-project/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User'; // Import our new User model

export async function POST(request) {
  const body = await request.json();
  const { userEmail, courseName, projectBrief, aiFeedback, skills } = body;

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
      skills: skills, // e.g., ["React", "Node.js"]
    };

    // 3. Find the user and push this new project into their array
    // We use "upsert: true" which means:
    // "Find this user and update them" OR "If they don't exist, create them"
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { 
        $push: { verifiedProjects: newVerifiedProject },
        $set: { email: userEmail } // This sets the email on creation
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