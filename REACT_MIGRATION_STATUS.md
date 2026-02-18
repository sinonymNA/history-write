# React Migration Status

## Phase 1: Scaffolding ✅ COMPLETE

### Files Created

#### Project Configuration
- ✅ `package.json` - Dependencies: React 18, Firebase 10.7, Tailwind, Lucide, confetti, xlsx
- ✅ `vite.config.js` - Vite bundler with React plugin
- ✅ `.gitignore` - Node modules, dist, env files excluded
- ✅ `public/index.html` - Minimal HTML entry point with `<div id="root">`

#### React Entry Points
- ✅ `src/index.jsx` - ReactDOM.createRoot initialization
- ✅ `src/App.jsx` - Main router wrapper + provider setup

#### Context Providers
- ✅ `src/context/AuthContext.jsx` - User authentication + Firebase integration (lines 2082–2101)
- ✅ `src/context/GameContext.jsx` - Game state + gamification (lines 2823–3625)
- ✅ `src/context/ThemeContext.jsx` - Light/dark theme toggling

#### Styles
- ✅ `src/styles/globals.css` - All CSS variables, theme colors, component classes (lines 20–560)
- ✅ `src/styles/animations.css` - All @keyframes animations (65+ animation definitions)

#### Libraries & Utils
- ✅ `src/lib/firebase.js` - Firebase config template + Firestore structure documentation
- ✅ `src/lib/constants.js` - Data structures template (ESSAY_BLOCKS, STORY_LESSONS, etc.)

#### Components
- ✅ `src/components/Landing.jsx` - Landing page placeholder (from views.landing, line ~1252)
- ✅ Folder structure created for all component categories:
  - `src/components/EssayBlocks/` - (4 components pending)
  - `src/components/GradingEngine/` - (1 component pending)
  - `src/components/SkillGarden/` - (1 component pending)
  - `src/components/Games/` - (4 components pending)
  - `src/components/StoryLessons/` - (1 component pending)
  - `src/components/Teacher/` - (4 components pending)
  - `src/components/UI/` - (4 components pending)
  - `src/components/shared/` - (2 components pending)

#### Hooks
- Folder created: `src/hooks/` (5 hooks pending):
  - `useFirebase.js` - Auth + Firestore
  - `useClaudeAPI.js` - API calls
  - `useGameState.js` - Game/essay state
  - `useTeacher.js` - Teacher logic
  - `useStudent.js` - Student logic

#### Utils
- Folder created: `src/utils/` (2 files pending):
  - `router.js` - Navigation helpers
  - `grading.js` - Mock grading fallback

## Next Steps: Phase 2 (View Migration)

Extract and convert 17 HTML view templates to JSX components (lines 1250–2081):

1. Auth views:
   - [ ] `Login.jsx` (line ~1437)
   - [ ] `Signup.jsx` (line ~1451)

2. Student views:
   - [ ] `StudentDashboard.jsx` (line ~1497)
   - [ ] `Editor.jsx`
   - [ ] `Results.jsx`

3. Essay Blocks views:
   - [ ] `EssayBlocks/BlocksSolo.jsx`
   - [ ] `EssayBlocks/BlocksLobby.jsx`
   - [ ] `EssayBlocks/BlocksPlay.jsx`
   - [ ] `EssayBlocks/BlocksReview.jsx`

4. Teacher views:
   - [ ] `TeacherDashboard.jsx` (line ~1473)
   - [ ] `Teacher/ClassManager.jsx`
   - [ ] `Teacher/AssignmentBuilder.jsx`
   - [ ] `Teacher/Library.jsx`

5. Game/Story views:
   - [ ] `StoryLessons/StoryLesson.jsx`
   - [ ] `Games/QuizGame.jsx`
   - [ ] `Games/BlockBlast.jsx`, `TimelineRace.jsx`, `SourceDetective.jsx`

## Environment Setup

To run locally:

```bash
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
npm run build      # Creates optimized dist/ folder
npm run preview    # Previews production build
```

## Firebase Configuration

Create `.env.local` with your Firebase credentials:

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_ANTHROPIC_API_KEY=...
```

## File Count Summary

- **Config files**: 4
- **React entry points**: 2
- **Context providers**: 3
- **Styles**: 2
- **Libraries/Utils**: 2
- **Components created**: 1 (Landing)
- **Component folders prepared**: 8
- **Hooks folder prepared**: 1 (5 pending)
- **Utils folder prepared**: 1 (2 pending)

**Total files created in Phase 1**: 17
**Component folders + subfolders prepared**: 15+

Original HTML file (`historywrite.html`) — UNTOUCHED ✅

---

## Mapping Reference (for Phase 2+)

| HTML Module | React File | HTML Lines | Status |
|-------------|-----------|-----------|--------|
| router | App.jsx + utils/router.js | 1206–1248 | Context setup ✅ |
| views | components/*.jsx | 1250–2081 | Phase 2 (17 files) |
| auth | context/AuthContext.jsx | 2082–2101 | Context setup ✅ |
| teacher | components/Teacher/*.jsx | 2102–2700 | Phase 2 |
| student | components/StudentDashboard.jsx | 2701–2822 | Phase 2 |
| game | context/GameContext.jsx | 2823–3625 | Context setup ✅ |
| quiz | components/Games/QuizGame.jsx | 3626–3872 | Phase 2 |
| story | components/StoryLessons/StoryLesson.jsx | 3873–4125 | Phase 2 |
| ai | hooks/useClaudeAPI.js | 4126–4212 | Phase 3 |
| ui | components/UI/*.jsx | 4213–4326 | Phase 2 |
| blocks | components/EssayBlocks/*.jsx | 4327–5291 | Phase 2 |
| lab | components/Teacher/LessonLab.jsx | 5292–5792 | Phase 2 |
| CSS | styles/globals.css + animations.css | 20–560 | Copied ✅ |
| Block templates | lib/constants.js | 859–1051 | Phase 3 |
| Story data | lib/constants.js | 1088–1202 | Phase 3 |
| Quiz bank | lib/constants.js | 1053–1087 | Phase 3 |
