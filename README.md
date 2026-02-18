# HistoryWrite

AI-powered essay grading, skill gardens, and arcade games for AP World History writing mastery.

## Quick Start (GitHub Codespaces) 🚀

The easiest way to run this project is with **GitHub Codespaces** — no local installation needed!

### Launch in Codespaces (1 Click)
1. Click **Code** → **Codespaces** → **Create codespace on main**
2. Wait ~2-3 minutes for the environment to build
3. Once ready, in the terminal run:
   ```bash
   npm run dev
   ```
4. Click the **Ports** tab to access the dev server
5. Follow setup instructions below to add Firebase credentials

**That's it!** No npm, Node, or local setup needed. Everything runs in your browser.

---

## Local Development Setup

If you prefer to develop locally:

### Prerequisites
- Node.js 18+ ([download here](https://nodejs.org/))
- npm (comes with Node.js)
- A Firebase project (free tier available)

### Installation
```bash
# Clone the repository
git clone https://github.com/sinonymNA/history-write.git
cd history-write

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click on your project
3. Click ⚙️ → **Project Settings**
4. Scroll down to "Your apps" → Find your web app
5. Copy the config values into `.env`:
   ```
   VITE_FIREBASE_API_KEY=xxxxx
   VITE_FIREBASE_AUTH_DOMAIN=xxxxx
   VITE_FIREBASE_PROJECT_ID=xxxxx
   VITE_FIREBASE_STORAGE_BUCKET=xxxxx
   VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
   VITE_FIREBASE_APP_ID=xxxxx
   ```

### Run Development Server
```bash
npm run dev
```

This starts the Vite dev server at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

Output goes to the `/dist` directory.

---

## Project Structure

```
src/
├── components/          # React components (27 total)
│   ├── Landing.jsx     # Homepage
│   ├── Login.jsx       # Login form
│   ├── Signup.jsx      # Registration
│   ├── StudentDashboard.jsx
│   ├── TeacherDashboard.jsx
│   ├── EssayBlocks/    # Essay writing modes
│   ├── Games/          # Game components
│   ├── Teacher/        # Teacher tools
│   ├── UI/             # UI utilities
│   └── shared/         # Shared components
├── context/            # React Context providers
│   ├── AuthContext.jsx
│   ├── GameContext.jsx
│   └── ThemeContext.jsx
├── hooks/              # Custom React hooks
│   ├── useFirebase.js
│   ├── useClaudeAPI.js
│   ├── useGameState.js
│   ├── useTeacher.js
│   └── useStudent.js
├── lib/
│   ├── constants.js    # Data structures & constants
│   └── firebase.js     # Firebase config
├── styles/
│   ├── globals.css     # CSS variables & components
│   └── animations.css  # Keyframe animations
├── App.jsx             # Main app with routing
└── index.jsx           # Entry point
```

---

## Features

✅ **Essay Writing**
- SAQ (Short Answer Question) blocks
- LEQ (Long Essay Question) blocks with guided parts
- DBQ (Document Based Question) with source analysis

✅ **Gamification**
- Skill garden with plant mechanics
- XP progression and level-ups
- Streak tracking

✅ **Games**
- Block Blast (MCQ arcade)
- Timeline Race (chronological ordering)
- Source Detective (POV analysis)
- Quiz Game (multiplayer)

✅ **Teacher Tools**
- Class management
- Assignment creation
- Lesson library
- AI lesson generation (Lesson Lab)

✅ **Story Lessons**
- Narrative history lessons
- Chapter progression with unlocks
- Quiz integration

✅ **Authentication**
- Firebase email/password auth
- Role-based dashboards (Student/Teacher)
- User profiles

✅ **UI**
- Light/dark theme toggle
- Responsive design (mobile-first)
- Smooth animations
- Loading states

---

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Firebase** - Backend (Auth + Firestore)
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **canvas-confetti** - Celebration effects

---

## Database Schema (Firestore)

```
firestore/
├── users/{uid}
│   ├── name, email, role (student/teacher)
│   ├── gamification (level, xp, plants)
│   └── createdAt
├── classes/{classId}
│   ├── name, code, teacherId
│   ├── students: [uids]
│   └── createdAt
├── assignments/{assignmentId}
│   ├── classId, title, type (saq/leq/dbq)
│   ├── prompt, maxAttempts
│   └── structure (for DBQ sources)
├── submissions/{submissionId}
│   ├── assignmentId, studentId
│   ├── essayContent, status
│   ├── score, feedback
│   └── submittedAt
└── teacherLessons/{lessonId}
    ├── teacherId, title, type
    ├── chapters, content
    └── createdAt
```

---

## File Mapping

All React components map directly to the original HTML file (`historywrite.html`). See [COMPONENT_MAPPING.md](./COMPONENT_MAPPING.md) for detailed source line references.

---

## Git Workflow

This repo uses feature branches with the pattern `claude/[feature]-[id]`:

```bash
# Development branch
git checkout claude/find-html-file-Ckaoq

# Make changes and commit
git add .
git commit -m "Clear, descriptive message"

# Push to remote
git push origin claude/find-html-file-Ckaoq
```

---

## Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Port 5173 already in use
Vite automatically uses the next available port.

### Firebase errors
- Verify `.env` file has correct credentials
- Check Firestore database exists
- Ensure Firebase rules allow read/write access

### Codespaces performance
- Codespaces with 2 CPU cores is standard
- Larger instances available if needed
- Browser caching can slow things down

---

## Environment Variables Reference

See `.env.example` for all required Firebase configuration variables. No other environment variables are required for local development.

---

## Contributing

Development happens on feature branches. All commits include:
- Clear commit messages
- References to source code mappings (where applicable)
- Session context URLs for tracking

---

## License

This project is for educational use in AP World History classrooms.

---

## Resources

- [GitHub Codespaces Setup](./.devcontainer/README.md)
- [Component Mapping](./COMPONENT_MAPPING.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
