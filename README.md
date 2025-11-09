# Branch

**Track, gamify, and share your focus.**

## Overview

Branch is a gamified productivity tracker that measures and improves how people work.

## Team

- **Ashia** – LLMs / Backend (AI insights, summaries, productivity models)
- **Dan** – Frontend / Backend (integration, data APIs, dashboards)
- **Theo** – Frontend (UI/UX, gamification, feed)
- **Suvas** – Backend (database, extension data ingestion, leaderboards)

## Architecture

```
dan/
├── web/              # Next.js web application
├── extension/        # Chrome browser extension
├── backend/          # Firebase Cloud Functions
└── shared/           # Shared types and utilities
```

## Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, React Query
- **Extension**: Chrome Manifest v3
- **Backend**: Firebase (Firestore, Functions, Auth)
- **AI**: OpenAI GPT-4o-mini, Hugging Face
- **Hosting**: Vercel (web), Firebase (backend)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI
- Chrome browser (for extension development)

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd DAN
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase
```bash
cd backend
firebase login
firebase init
```

4. Configure environment variables
```bash
cp .env.example .env.local
# Add your Firebase and OpenAI credentials
```

5. Run development servers
```bash
# Web app
cd web
npm run dev

# Backend functions
cd backend
npm run serve
```

6. Load extension in Chrome
- Navigate to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `extension/` directory

## Development Roadmap

### Week 1: Setup ✅
- [x] Project structure and dependencies
- [ ] Firebase configuration
- [ ] Authentication setup

### Week 2: Extension
- [ ] Tab tracking
- [ ] Idle detection
- [ ] Backend integration

### Week 3: Dashboard
- [ ] Session timer UI
- [ ] Stats visualization
- [ ] Real-time updates

### Week 4: Gamification
- [ ] XP system
- [ ] Streaks and badges
- [ ] Leaderboards

### Week 5: AI Integration
- [ ] GPT summaries
- [ ] Productivity scoring
- [ ] Weekly digest

### Week 6: Polish & Deploy
- [ ] UI refinements
- [ ] Testing
- [ ] Production deployment

## Features

### Core Features (MVP)
- ✅ Browser extension for automatic session tracking
- ✅ Real-time study session dashboard
- ✅ XP, streaks, and badges
- ✅ Friend feed and leaderboards
- ✅ AI-generated summaries and insights
- ✅ Weekly summary reports

### Future Features
- Study challenges and duels
- Virtual points and betting system
- Calendar integration
- Mobile app
- Team study rooms

## Privacy

- We collect only metadata (domain, title, duration, activity metrics)
- No content or keystroke text is saved
- Opt-in consent for AI analytics
- Data export and deletion available

## License

MIT

## Contact

For questions or support, reach out to the team.

