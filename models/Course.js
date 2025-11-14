// models/Course.js
import mongoose from 'mongoose';

const QuizQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String
});

const ModuleSchema = new mongoose.Schema({
  name: String,
  startTime: Number,
  endTime: Number,
  type: {
    type: String,
    enum: ['quiz', 'project', 'complete']
  },
  quizData: [QuizQuestionSchema], // Will be empty if type is 'project'
  projectBrief: String // Will be empty if type is 'quiz'
});

const CourseSchema = new mongoose.Schema({
  videoURL: {
    type: String,
    required: true,
    unique: true
  },
  // --- THIS IS THE FIX ---
  // We must add videoID and courseTitle so they can be saved to the DB
  videoID: {
    type: String,
    required: true
  },
  courseTitle: {
    type: String,
    default: "Untitled Course"
  },
  // --- END OF FIX ---
  modules: [ModuleSchema]
});

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);