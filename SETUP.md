# Branch - Setup Guide

This guide will help you get the Branch productivity tracker up and running.

## Prerequisites

- **Node.js 18+** and npm
- **Firebase CLI**: `npm install -g firebase-tools`
- **Chrome** or Chromium-based browser (for extension)
- **OpenAI API Key** (for AI features)
- **Firebase Project** (create at https://console.firebase.google.com)

## Quick Start

### 1. Clone and Install

```bash
cd DAN
npm install
npm run install:all
```

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase (in backend directory)
cd backend
firebase init

# Select:
# - Firestore
# - Functions
# - Choose your project
# - Use TypeScript
```

### 3. Environment Variables

Create `.env.local` files in the `web` directory:

```bash
# web/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:5001
```

Create `.env` in the `backend/functions` directory:

```bash
# backend/functions/.env
OPENAI_API_KEY=your_openai_api_key
```

### 4. Build Shared Package

```bash
cd shared
npm run build
```

### 5. Run Development Servers

**Terminal 1 - Web App:**
```bash
cd web
npm run dev
# Visit http://localhost:3000
```

**Terminal 2 - Firebase Emulators:**
```bash
cd backend
npm run serve
# Firebase UI: http://localhost:4000
# Functions: http://localhost:5001
# Firestore: http://localhost:8080
```

**Terminal 3 - Extension:**
```bash
cd extension
npm run build
```

### 6. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/dist` directory
5. The extension should now be active!

## Firebase Configuration

### Firestore Security Rules

The rules are already defined in `backend/firestore.rules`. Deploy them:

```bash
cd backend
firebase deploy --only firestore:rules
```

### Create Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### Deploy Cloud Functions (Optional for Production)

```bash
firebase deploy --only functions
```

## Testing the App

### 1. Sign In

- Open http://localhost:3000
- Click "Sign in with Google"
- Authorize the app

### 2. Test Extension

- Navigate to a study website (e.g., docs.python.org, khan academy, etc.)
- The extension should automatically start tracking
- Click the extension icon to see the current session
- Or start a manual session from the popup

### 3. View Dashboard

- After a session completes, visit the dashboard
- You should see XP earned, stats updated, and the session in your history

### 4. Explore Features

- **Dashboard**: Overview of stats, current session, XP, streaks
- **Sessions**: Full history of study sessions
- **Social**: Friend feed and activities
- **Leaderboard**: Global and friend rankings
- **To-Dos**: Task management
- **Insights**: AI-generated feedback and tips

## Development Tips

### Hot Reload

- **Web**: Next.js hot reloads automatically
- **Extension**: Rebuild with `npm run watch` and reload extension in Chrome
- **Backend**: Firebase emulators restart on file changes

### Debugging

**Extension:**
```bash
# View background script logs
chrome://extensions/ → Click "service worker" under DAN extension
```

**Firebase Functions:**
```bash
# View function logs
firebase functions:log
```

**Firestore:**
- Use Firebase Emulator UI at http://localhost:4000
- View and edit data in real-time

### Testing AI Features

The AI summary and insights require an OpenAI API key. Without it:
- Sessions will still be tracked
- XP and gamification work normally
- AI summaries will use fallback text

## Common Issues

### Port Already in Use

If port 3000 or 5001 is taken:

```bash
# Web (change in package.json)
next dev -p 3001

# Backend (change in firebase.json)
"emulators": {
  "functions": { "port": 5002 }
}
```

### Extension Not Tracking

Check:
1. Extension is loaded and active
2. You're on a whitelisted study domain
3. Background service worker is running (check in chrome://extensions)

### Firebase Auth Issues

1. Enable Google Sign-in in Firebase Console
2. Add `localhost` to authorized domains
3. Check that environment variables are correct

## Production Deployment

### Web App (Vercel)

```bash
cd web
npm run build
# Deploy to Vercel
vercel deploy --prod
```

### Backend (Firebase)

```bash
cd backend
firebase deploy
```

### Extension (Chrome Web Store)

1. Build for production: `cd extension && npm run build`
2. Create a ZIP: `zip -r dan-extension.zip dist/`
3. Upload to Chrome Web Store Developer Dashboard
4. Submit for review

## Next Steps

1. **Add Real Data**: Connect Firestore queries in components
2. **Implement Real-time Updates**: Use Firestore listeners
3. **Enhance AI**: Improve prompts and add more insights
4. **Add Tests**: Write unit and integration tests
5. **Optimize Performance**: Add caching and lazy loading
6. **Mobile App**: Consider React Native version

## Support

For issues or questions:
- Check the README.md
- Review the PRD document
- Contact the team

## License

MIT

