import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course';

export async function GET(request, { params: paramsPromise }) {
  // --- THIS IS THE FIX ---
  // We must 'await' the params promise to get the actual values
  const params = await paramsPromise;
  const { videoID } = params;
  // --- END OF FIX ---

  if (!videoID) {
    return NextResponse.json({ error: 'videoID is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const course = await Course.findOne({ videoID: videoID });

    if (!course) {
      return NextResponse.json({ error: 'Course not found. It may not have been generated yet.' }, { status: 404 });
    }

    return NextResponse.json(course);

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: `Failed to fetch course: ${error.message}` }, { status: 500 });
  }
}