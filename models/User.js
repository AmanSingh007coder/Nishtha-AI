// models/User.js
import mongoose from 'mongoose';

// This is the "Building Block" for the resume
const VerifiedProjectSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
  },
  projectBrief: {
    type: String,
    required: true,
  },
  aiFeedback: {
    type: String, // We'll store the AI's feedback
  },
  skills: [String], // e.g., ["React", "Node.js"]
  verifiedAt: {
    type: Date,
    default: Date.now,
  },
});

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // We will store all their achievements in an array
  verifiedProjects: [VerifiedProjectSchema], 
  
  // We'll also store their wallet address for the NFT
  walletAddress: {
    type: String,
  }
});

// This is a Mongoose best practice: 
// It prevents Next.js from recompiling the model every time
export default mongoose.models.User || mongoose.model('User', UserSchema);