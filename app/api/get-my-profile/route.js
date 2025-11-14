// app/api/get-my-profile/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User'; 

export async function POST(request) {
  const body = await request.json();
  const { userEmail } = body;

  if (!userEmail) {
    return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
  }

  try {
    // 1. Connect to the database
    await dbConnect();

    // 2. Find the user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Return the user's data (especially their verified projects)
    return NextResponse.json({ success: true, user: user });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: `Failed to fetch profile: ${error.message}` }, { status: 500 });
  }
}