// models/User.js
import mongoose from 'mongoose';

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
    type: String,
  },
  skills: [String],
  verifiedAt: {
    type: Date,
    default: Date.now,
  },
  // --- ADD THESE TWO LINES ---
  transactionHash: { type: String },
  tokenId: { type: String },
  // ---
});

const UserSchema = new mongoose.Schema({
  // ... (rest of UserSchema is the same)
  email: {
    type: String,
    required: true,
    unique: true,
  },
  verifiedProjects: [VerifiedProjectSchema], 
  walletAddress: {
    type: String,
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);