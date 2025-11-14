# Nishtha AI

## 🚀 The AI & Blockchain Verifier for Developer Skills

Nishtha AI transforms YouTube tutorials into a fully interactive, AI-gated, blockchain-verified learning system. Instead of passively watching tutorials or relying on AI to write code, users are guided through a structured, hands-on learning loop that validates their understanding at every step.

---

## 📌 Why Nishtha AI Exists

### The Core Problems

* **Tutorial Hell:** Endless passive watching → zero real retention.
* **AI-Crutch Learning:** Developers rely on LLMs to create entire projects, producing fake, shallow portfolios.
* **Recruiter Blindness:** Identical GitHub repos give no signal of real skill.
* **Trust Deficit:** Certificates can be faked; portfolios are unverified.

### The Mission

To create a world where every developer’s skill is:

* Verified by AI
* Proven through real work
* Stored immutably on the blockchain
* Presented through a dynamic, always-up-to-date resume

---

## 🎯 What Nishtha AI Does

Nishtha AI introduces the **AI-Gated Learning Loop**, a system that forces active recall, builds real skills, and ensures the learner truly understands what they claim.

### **1. Paste a YouTube Course URL**

Users begin by entering any long-form YouTube coding course.

### **2. AI-Gated Chapters (Quiz Loop)**

For every chapter:

* Video plays
* Auto-pauses at chapter ending
* AI generates a 3–5 question technical quiz from the transcript
* Passing unlocks the next chapter

### **3. AI-Gated Projects (Project Loop)**

After a module (e.g., 4 chapters):

* AI creates a “Mini-Capstone” project
* User builds it inside a GitHub repo
* Backend fetches the code via GitHub API
* AI Tech Lead reviews the project (accuracy, quality, completeness)
* AI Interviewer asks a personalized explanation question
* User must answer correctly to pass

### **4. Blockchain Minting (Proof-of-Skill NFT)**

Every successfully validated project mints a digital credential on the **Polygon Amoy Testnet**, containing:

* Skill tags
* Project summary
* Verification metadata

### **5. Living Resume**

All verified achievements sync into MongoDB as “Building Blocks.”
These are assembled by AI into a dynamic JSON resume and rendered beautifully via `react-cv`.

---

## 🧱 System Architecture

### Frontend

* **Next.js (React)** — Unified frontend + API backend
* **Tailwind CSS + shadcn/ui** — Modern UI components
* **react-player** — Video playback and chapter detection

### Backend & Integrations

* **Next.js API Routes** — Main logic layer
* **MongoDB Atlas** — User profiles + Building Blocks
* **youtube-transcript** — Transcript + chapter extraction
* **GitHub REST API** — Fetch code for review

### AI Layer

* **Gemini 2.0 Flash Lite** — Quiz generation, project briefs, code review, anti-cheat questions, resume assembler

### Blockchain Layer

* **Polygon Amoy Testnet** — Free blockchain environment
* **Thirdweb SDK / Ethers.js** — Minting + wallet interactions

---

## 📦 User Journey (Simplified)

1. Paste YouTube URL
2. Watch → Quiz → Unlock
3. Complete Module → AI Project
4. Push to GitHub
5. AI Tech Lead Review
6. AI Interviewer Verification
7. Mint NFT Credential
8. Add to Living Resume
9. Share, apply, grow

---

## 💰 Business Model

### Free Tier

* 1 full course OR 3 project verifications
* Core AI quizzes
* Basic resume

### Pro Tier — **$10/month**

* Unlimited courses
* Unlimited AI project reviews
* Full Living Resume
* LinkedIn + job prep tools

### Microtransactions

* $1 per AI Hint during tough projects

### Future B2B Offering

Recruiters get access to blockchain-verified talent with real proof of skill.

---

## 🛠️ Installation & Development

```bash
# Clone the repo
git clone https://github.com/yourname/nishtha-ai
cd nishtha-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

```
GEMINI_API_KEY=
MONGODB_URI=
THIRDWEB_PRIVATE_KEY=
NEXT_PUBLIC_BLOCKCHAIN_RPC=
```

---


